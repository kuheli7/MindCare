import mongoose from "mongoose";

const AssessmentTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isSpecialized: { type: Boolean, default: false }
});

const AssessmentType = mongoose.model("AssessmentType", AssessmentTypeSchema);
export default AssessmentType;
