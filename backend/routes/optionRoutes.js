import express from "express";
import Option from "../models/Option.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET options by question (RESTORED FRONTEND COMPATIBILITY)
router.get("/question/:questionId", async (req, res) => {
  try {
    const options = await Option.find({ question_id: req.params.questionId });
    res.json(options);
  } catch (err) {
    res.status(500).json({ message: "Error fetching options" });
  }
});

// POST create option
router.post("/", protect, admin, async (req, res) => {
  try {
    const option = new Option(req.body);
    await option.save();
    res.status(201).json(option);
  } catch (err) {
    res.status(500).json({ message: "Error creating option" });
  }
});

// DELETE option
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    await Option.findByIdAndDelete(req.params.id);
    res.json({ message: "Option deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting option" });
  }
});

export default router;