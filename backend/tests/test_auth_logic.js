import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();
if (!process.env.MONGO_URI) {
    dotenv.config({ path: 'backend/.env' });
}

const testAuthLogic = async () => {
    try {
        console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

        const token = jwt.sign({ id: "test-id" }, process.env.JWT_SECRET, { expiresIn: "30d" });
        console.log("JWT Sign test: SUCCESS");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        const user = await User.findOne({ email: "student@mindcare.com" });
        if (user) {
            const isMatch = await user.comparePassword("studentpassword");
            console.log("Password match for student:", isMatch);
        } else {
            console.log("Student user not found in DB");
        }

        process.exit(0);
    } catch (err) {
        console.error("Auth logic test FAILED:", err);
        process.exit(1);
    }
};

testAuthLogic();
