import express from "express";
import OptionSet from "../models/OptionSet.js";
import Option from "../models/Option.js";

const router = express.Router();

// ====================================
// CREATE OPTION SET (with options)
// ====================================
router.post("/", async (req, res) => {
  try {
    const { set_name, description } = req.body;

    if (!set_name) {
      return res.status(400).json({ error: "Option set name is required" });
    }

    // Check if option set already exists
    const existingSet = await OptionSet.findOne({ set_name });
    if (existingSet) {
      return res.status(400).json({ error: "Option set with this name already exists" });
    }

    const optionSet = await OptionSet.create({ set_name, description });
    res.status(201).json(optionSet);
  } catch (err) {
    console.error('OptionSet creation error', err);
    res.status(500).json({ error: "Error creating option set" });
  }
});

// ====================================
// GET ALL OPTION SETS WITH OPTIONS
// ====================================
router.get("/", async (req, res) => {
  try {
    const optionSets = await OptionSet.find();

    const setsWithOptions = await Promise.all(
      optionSets.map(async (set) => {
        const options = await Option.find({ option_set_id: set._id, question_id: null }).sort({ order: 1 });
        return {
          ...set.toObject(),
          options
        };
      })
    );

    res.json(setsWithOptions);
  } catch (err) {
    res.status(500).json({ error: "Error fetching option sets" });
  }
});

// ====================================
// GET OPTION SET BY ID WITH OPTIONS
// ====================================
router.get("/:id", async (req, res) => {
  try {
    const optionSet = await OptionSet.findById(req.params.id);
    if (!optionSet) {
      return res.status(404).json({ error: "Option set not found" });
    }

    const options = await Option.find({ option_set_id: optionSet._id, question_id: null }).sort({ order: 1 });

    res.json({
      ...optionSet.toObject(),
      options
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching option set" });
  }
});

// ====================================
// UPDATE OPTION SET
// ====================================
router.put("/:id", async (req, res) => {
  try {
    const { set_name, description } = req.body;

    const updatedSet = await OptionSet.findByIdAndUpdate(
      req.params.id,
      { set_name, description },
      { new: true }
    );

    if (!updatedSet) {
      return res.status(404).json({ error: "Option set not found" });
    }

    res.json(updatedSet);
  } catch (err) {
    res.status(500).json({ error: "Error updating option set" });
  }
});

// ====================================
// DELETE OPTION SET (and its options)
// ====================================
router.delete("/:id", async (req, res) => {
  try {
    // Delete all options in this set
    await Option.deleteMany({ option_set_id: req.params.id });

    // Delete the option set
    const deletedSet = await OptionSet.findByIdAndDelete(req.params.id);

    if (!deletedSet) {
      return res.status(404).json({ error: "Option set not found" });
    }

    res.json({ message: "Option set and its options deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting option set" });
  }
});

export default router;
