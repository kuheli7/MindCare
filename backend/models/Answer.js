import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentAttempt", required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  option_id: { type: mongoose.Schema.Types.ObjectId, ref: "Option", required: true },
  points_awarded: Number
});

const Answer = mongoose.model("Answer", AnswerSchema);
export default Answer;
