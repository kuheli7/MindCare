import mongoose from "mongoose";


const ScoreSchema = new mongoose.Schema({
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssessmentAttempt",
    required: true
  },
  total_score: Number,
  maximum_total_score: Number,
  overall_normalized_score: Number,
  risk_level: String,
  domain_scores: [{
    domain_id: { type: mongoose.Schema.Types.ObjectId, ref: "Domain" },
    domain_name: String,
    score: Number,
    max_score: Number,
    normalized_score: Number
  }],
  recommendations: [{
    test_name: String,
    reason: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Score", ScoreSchema);

