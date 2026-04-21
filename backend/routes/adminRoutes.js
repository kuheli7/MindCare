import express from "express";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import Score from "../models/Score.js";
import User from "../models/User.js";
import AssessmentType from "../models/AssessmentType.js";
import Category from "../models/Category.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Get system analytics (overview stats)
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get("/analytics", async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const [totalTests, todayTests, weekTests, monthTests] = await Promise.all([
      AssessmentAttempt.countDocuments(),
      AssessmentAttempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      AssessmentAttempt.countDocuments({ createdAt: { $gte: startOfWeek } }),
      AssessmentAttempt.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    // Risk distribution
    const scores = await Score.find({}, 'risk_level');
    const riskCounts = {};
    scores.forEach(s => {
      if (s.risk_level) {
        riskCounts[s.risk_level] = (riskCounts[s.risk_level] || 0) + 1;
      }
    });

    res.json({
      totalTests,
      todayTests,
      weekTests,
      monthTests,
      riskDistribution: Object.entries(riskCounts).map(([label, count]) => ({ _id: label, count }))
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// @desc    Get test history with user names and scores for admin dashboard
// @route   GET /api/admin/test-history
// @access  Private/Admin
router.get("/test-history", async (req, res) => {
  try {
    const attempts = await AssessmentAttempt.find()
      .populate('student_id', 'name display_name email')
      .populate('assessment_type_id', 'name')
      .populate('category_id', 'label min_score max_score')
      .sort({ createdAt: -1 })
      .limit(100);

    const histories = await Promise.all(attempts.map(async (attempt) => {
      // Find the score document for this attempt
      const scoreDoc = await Score.findOne({ attempt_id: attempt._id });

      const user = attempt.student_id;
      let displayName = 'Unknown';
      if (user) {
        displayName = user.display_name || user.name || user.email;
      }

      const domainScores = scoreDoc?.domain_scores || [];
      const domains = domainScores.map(d => d.domain_name);
      const scoresMap = {};
      domainScores.forEach(d => {
        scoresMap[d.domain_name.toLowerCase()] = Math.round(d.normalized_score);
      });

      return {
        id: attempt._id,
        date: attempt.createdAt,
        userId: displayName,
        isAnonymous: (user?.display_name || '').startsWith('User_'),
        assessmentType: attempt.assessment_type_id?.name || 'General',
        domains,
        scores: scoresMap,
        overallScore: Math.round(scoreDoc?.overall_normalized_score || 0),
        riskLevel: scoreDoc?.risk_level || attempt.category_id?.label || 'Unknown',
        recommendations: scoreDoc?.recommendations || []
      };
    }));

    res.json(histories);
  } catch (err) {
    console.error('Test history error:', err.message);
    res.status(500).json({ message: "Error fetching test history" });
  }
});

// Admin Category CRUD
router.post("/category", protect, admin, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Error creating category" });
  }
});

export default router;
