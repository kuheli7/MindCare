import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },
  assessment_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentType"
  },
  attempt_date: { type: Date, default: Date.now },
  status: String,
  raw_answers: { type: Object }
});

export default mongoose.model("AssessmentAttempt", AttemptSchema);
