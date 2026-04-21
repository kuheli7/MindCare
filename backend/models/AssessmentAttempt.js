import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assessment_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AssessmentType",
        required: true
    },
    total_score: { type: Number, default: 0 },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    createdAt: { type: Date, default: Date.now }
});

const AssessmentAttempt = mongoose.model("AssessmentAttempt", AttemptSchema);
export default AssessmentAttempt;
