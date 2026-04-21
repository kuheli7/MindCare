import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
  assessment_type_id: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentType", required: true },
  question_text: { type: String, required: true },
  option_set_id: { type: mongoose.Schema.Types.ObjectId, ref: "OptionSet" }, // NEW: Reference to reusable options
  order: { type: Number, default: 0 },
  weight: { type: Number, default: 1 }
});

const Question = mongoose.model("Question", QuestionSchema);
export default Question;
