import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

const AUTH_COOKIE_NAME = "mindcare_token";

const getCookieToken = (req) => {
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return null;

    const pairs = cookieHeader.split(";").map((item) => item.trim());
    for (const pair of pairs) {
        if (pair.startsWith(`${AUTH_COOKIE_NAME}=`)) {
            return decodeURIComponent(pair.substring(AUTH_COOKIE_NAME.length + 1));
        }
    }

    return null;
};

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try User collection first
            let user = await User.findById(decoded.id).select("-password");

            // If not found, try Admin collection
            if (!user) {
                user = await Admin.findById(decoded.id).select("-password");
                if (user) {
                    // Normalize for middleware check
                    user.role = "admin";
                }
            }

            if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        token = getCookieToken(req);
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                let user = await User.findById(decoded.id).select("-password");

                if (!user) {
                    user = await Admin.findById(decoded.id).select("-password");
                    if (user) {
                        user.role = "admin";
                    }
                }

                if (!user) {
                    return res.status(401).json({ message: "Not authorized, user not found" });
                }

                req.user = user;
                return next();
            } catch (error) {
                console.error(error);
                return res.status(401).json({ message: "Not authorized, token failed" });
            }
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

export const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(401).json({ message: "Not authorized as an admin" });
    }
};
