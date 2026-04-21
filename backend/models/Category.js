import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  assessment_type_id: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentType", required: true },
  min_score: { type: Number, required: true },
  max_score: { type: Number, required: true },
  label: { type: String, required: true },
  recommendation_text: String
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;
