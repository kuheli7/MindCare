import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
  try {
    const hashed = await bcrypt.hash("123", 10);


    await Admin.create({
      username: "team10admin",
      email: "admin@mindcare.com",
      password: hashed
    });

    console.log("Admin created successfully");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
