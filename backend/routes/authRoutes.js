import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const AUTH_COOKIE_NAME = "mindcare_token";
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const DUMMY_SALT = bcrypt.genSaltSync(10);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const isBcryptHash = (value) => BCRYPT_HASH_REGEX.test(String(value || "").trim());
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeName = (value) => String(value || "").trim();
const normalizePasswordHash = (value) => String(value || "").trim();

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/"
});

const toSafeUser = (user, role) => ({
  _id: user._id,
  name: user.name || user.username,
  email: user.email,
  role
});

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const getUserByLogin = async (emailOrUsername) => {
  const normalizedEmailOrUsername = String(emailOrUsername || "").trim();
  let user = await User.findOne({ email: normalizeEmail(normalizedEmailOrUsername) });
  let role = user ? user.role : null;

  if (!user) {
    user = await Admin.findOne({
      $or: [
        { email: normalizeEmail(normalizedEmailOrUsername) },
        { username: normalizedEmailOrUsername }
      ]
    });
    if (user) {
      role = "admin";
    }
  }

  return { user, role };
};

router.post("/login-salt", async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmailOrUsername = String(email || "").trim();

  if (!normalizedEmailOrUsername) {
    return res.status(400).json({ message: "Email/username is required." });
  }

  try {
    const { user } = await getUserByLogin(normalizedEmailOrUsername);
    const salt = user?.password && isBcryptHash(user.password)
      ? user.password.slice(0, 29)
      : DUMMY_SALT;

    return res.json({ salt });
  } catch (error) {
    console.error("Auth login-salt error:", error.message);
    return res.status(500).json({ message: "Could not start login. Please try again." });
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  const normalizedName = normalizeName(name);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizePasswordHash(password);

  try {
    if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({ message: "Name must be between 2 and 80 characters." });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (!isBcryptHash(normalizedPassword)) {
      return res.status(400).json({ message: "Password must be sent as a bcrypt hash." });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: role || "student"
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Auth register error:", error.message);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmailOrUsername = String(email || "").trim();
  const normalizedPassword = normalizePasswordHash(password);

  try {
    if (!normalizedEmailOrUsername || !normalizedPassword) {
      return res.status(400).json({ message: "Email/username and password are required." });
    }

    if (!isBcryptHash(normalizedPassword)) {
      return res.status(400).json({ message: "Password must be sent as a bcrypt hash." });
    }

    const { user, role } = await getUserByLogin(normalizedEmailOrUsername);

    if (user && normalizedPassword === user.password) {
      const token = generateToken(user._id);
      res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
      res.json(toSafeUser(user, role));
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Auth login error:", error.message);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined
  });
  return res.json({ success: true, message: "Logged out." });
});

router.get("/me", protect, async (req, res) => {
  const role = req.user?.role || "student";
  return res.json(toSafeUser(req.user, role));
});

export default router;
