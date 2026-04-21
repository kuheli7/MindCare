import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import { getCategoryForScore } from "../models/utils/calculateScore.js";
import Category from "../models/Category.js";
import AssessmentType from "../models/AssessmentType.js";

dotenv.config();
if (!process.env.MONGO_URI) {
    dotenv.config({ path: 'backend/.env' });
}

const runTest = async () => {
    try {
        await connectDB();

        const generalType = await AssessmentType.findOne({ name: /General/i });
        if (!generalType) {
            console.error("General Wellness assessment type not found. Please run seed.js first.");
            process.exit(1);
        }

        const testScores = [10, 24.99, 24.995, 25, 40, 49.99, 49.999, 50, 74.99, 75, 90];

        let output = `Testing category mapping for Assessment Type: ${generalType.name} (${generalType._id})\n`;

        for (const score of testScores) {
            const category = await getCategoryForScore(generalType._id, score);
            output += `Score: ${score.toFixed(3)} -> Category: ${category ? category.label : "NONE"}\n`;
        }

        console.log(output);
        process.exit(0);
    } catch (err) {
        console.error("Test failed", err);
        process.exit(1);
    }
};

runTest();
