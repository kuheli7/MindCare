import express from "express";
import Question from "../models/Question.js";
import Option from "../models/Option.js";
import OptionSet from "../models/OptionSet.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET questions by domain (RESTORED FRONTEND COMPATIBILITY)
// supports optional ?assessment_type_id=<id> to narrow the results.
router.get("/domain/:domainId", async (req, res) => {
  try {
    const { assessment_type_id } = req.query;
    const filter = { domain_id: req.params.domainId };
    if (assessment_type_id) {
      filter.assessment_type_id = assessment_type_id;
    }

    const questions = await Question.find(filter);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

// Create question – options are auto-copied from the chosen OptionSet
router.post("/", protect, admin, async (req, res) => {
  try {
    const { domain_id, assessment_type_id, question_text, order, weight, option_set_id } = req.body;

    if (!option_set_id) {
      return res.status(400).json({ message: "option_set_id is required" });
    }

    // Verify the option set exists
    const optionSet = await OptionSet.findById(option_set_id);
    if (!optionSet) {
      return res.status(404).json({ message: "OptionSet not found" });
    }

    // Create the question with the option_set_id reference
    const question = new Question({
      domain_id,
      assessment_type_id,
      question_text,
      order,
      weight,
      option_set_id
    });
    await question.save();

    // Auto-copy only 'template' options (those where question_id is null) for this OptionSet
    const sourceOptions = await Option.find({ option_set_id, question_id: null }).sort({ order: 1 });
    if (sourceOptions.length > 0) {
      const optionDocs = sourceOptions.map(opt => ({
        question_id: question._id,
        option_set_id: opt.option_set_id,
        option_text: opt.option_text,
        points: opt.points,
        order: opt.order
      }));
      await Option.insertMany(optionDocs);
    }

    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating question" });
  }
});

// UPDATE question (text only - options are managed separately)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { question_text, weight } = req.body;
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update fields
    if (question_text !== undefined) question.question_text = question_text;
    if (weight !== undefined) question.weight = weight;
    
    await question.save();
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating question" });
  }
});

// DELETE question
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    await Option.deleteMany({ question_id: req.params.id });
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting question" });
  }
});

export default router;
