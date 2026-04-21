import mongoose from "mongoose";

const AssessmentTypeSchema = new mongoose.Schema({
  name: String,
  mode: String,
  description: String
});


export default mongoose.model("AssessmentType", AssessmentTypeSchema);
