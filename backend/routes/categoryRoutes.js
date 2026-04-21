import express from "express";
import Category from "../models/Category.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
router.get("/", async (req, res) => {
    try {
        const { assessment_type_id } = req.query;
        const filter = assessment_type_id ? { assessment_type_id } : {};
        const categories = await Category.find(filter).sort({ min_score: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: "Error fetching categories" });
    }
});

// @desc    Bulk update categories (also accepts call to base path as fallback)
// @route   PUT /api/categories/bulk
// @route   PUT /api/categories            <- convenience for clients that omit "bulk"
router.put(["/bulk", "/"], protect, async (req, res) => {
    try {
        const { categories } = req.body; // Array of { id, min_score, max_score, label }

        if (!Array.isArray(categories)) {
            return res.status(400).json({ message: "Expected categories array" });
        }

        const updatePromises = categories.map(async (c) => {
            return Category.findByIdAndUpdate(c._id || c.id, {
                min_score: c.min_score,
                max_score: c.max_score,
                label: c.label,
                recommendation_text: c.recommendation_text
            }, { new: true });
        });

        const results = await Promise.all(updatePromises);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Error bulk updating categories" });
    }
});

// @desc    Update a category
// @route   PUT /api/categories/:id
router.put("/:id", protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const { min_score, max_score, label, recommendation_text } = req.body;
        category.min_score = min_score ?? category.min_score;
        category.max_score = max_score ?? category.max_score;
        category.label = label || category.label;
        category.recommendation_text = recommendation_text || category.recommendation_text;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (err) {
        res.status(500).json({ message: "Error updating category" });
    }
});
// @desc    Update a category
// @route   PUT /api/categories/:id
router.put("/:id", protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const { min_score, max_score, label, recommendation_text } = req.body;
        category.min_score = min_score ?? category.min_score;
        category.max_score = max_score ?? category.max_score;
        category.label = label || category.label;
        category.recommendation_text = recommendation_text || category.recommendation_text;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (err) {
        res.status(500).json({ message: "Error updating category" });
    }
});

// @desc    Bulk update categories
// @route   PUT /api/categories/bulk
router.put("/bulk", protect, async (req, res) => {
    try {
        const { categories } = req.body; // Array of { id, min_score, max_score, label }

        const updatePromises = categories.map(async (c) => {
            return Category.findByIdAndUpdate(c._id || c.id, {
                min_score: c.min_score,
                max_score: c.max_score,
                label: c.label,
                recommendation_text: c.recommendation_text
            }, { new: true });
        });

        const results = await Promise.all(updatePromises);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Error bulk updating categories" });
    }
});

export default router;
