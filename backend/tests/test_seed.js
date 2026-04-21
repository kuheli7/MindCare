import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import AssessmentType from "../models/AssessmentType.js";
import Domain from "../models/Domain.js";
import User from "../models/User.js";

dotenv.config();
if (!process.env.MONGO_URI) {
    dotenv.config({ path: 'backend/.env' });
}

const simpleSeed = async () => {
    try {
        await connectDB();
        console.log("Connected");
        await User.deleteMany({});
        await AssessmentType.deleteMany({});
        await Domain.deleteMany({});

        console.log("Cleared. Creating Type...");
        const type = await AssessmentType.create({ name: "General", description: "Test" });
        console.log("Type created:", type._id);

        console.log("Creating Domain...");
        const domain = await Domain.create({
            assessment_type_id: type._id,
            domain_name: "Stress",
            color: "#123456"
        });
        console.log("Domain created:", domain._id);

        process.exit(0);
    } catch (err) {
        console.error("SIMPLE SEED FAILED");
        console.error(err);
        process.exit(1);
    }
};
simpleSeed();
