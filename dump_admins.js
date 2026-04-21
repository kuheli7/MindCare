import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./backend/models/Admin.js";
import fs from 'fs';

dotenv.config({ path: 'backend/.env' });

const dumpAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const admins = await Admin.find({});
        fs.writeFileSync('admins_dump.json', JSON.stringify(admins, null, 2));
        console.log("Dumped admins to admins_dump.json");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dumpAdmins();
