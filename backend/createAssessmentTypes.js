import mongoose from "mongoose";
import dotenv from "dotenv";
import AssessmentType from "./models/AssessementType.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const createAssessmentTypes = async () => {
  try {
    // Check if assessment types already exist
    const existingTypes = await AssessmentType.find();
    
    if (existingTypes.length === 0) {
      await AssessmentType.insertMany([
        {
          name: "General",
          mode: "general",
          description: "General assessment type"
        },
        {
          name: "Specialized",
          mode: "specialized",
          description: "Specialized assessment type"
        }
      ]);
      console.log("Assessment types created successfully");
    } else {
      console.log("Assessment types already exist");
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAssessmentTypes();
