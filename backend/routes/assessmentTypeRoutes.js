import express from "express";
import AssessmentType from "../models/AssessmentType.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Get all assessment types
// @route   GET /api/assessments
// @access  Public
router.get("/", async (req, res) => {
  try {
    const assessmentTypes = await AssessmentType.find();
    res.json(assessmentTypes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assessment types" });
  }
});

// @desc    Get assessment type by ID
// @route   GET /api/assessments/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const assessmentType = await AssessmentType.findById(req.params.id);
    if (!assessmentType) {
      return res.status(404).json({ message: "Assessment type not found" });
    }
    res.json(assessmentType);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assessment type" });
  }
});

// @desc    Create new assessment type
// @route   POST /api/admin/assessment
// @access  Private/Admin
router.post("/admin", protect, admin, async (req, res) => {
  try {
    const { name, description, isSpecialized } = req.body;

    const newAssessmentType = new AssessmentType({
      name,
      description,
      isSpecialized: isSpecialized || false
    });

    const savedAssessmentType = await newAssessmentType.save();
    res.status(201).json(savedAssessmentType);
  } catch (err) {
    res.status(500).json({ message: "Failed to create assessment type" });
  }
});

export default router;
