import express from "express";
import Domain from "../models/Domain.js";
import Question from "../models/Question.js";
import Option from "../models/Option.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET questions with options by multiple domain names (RESTORED FRONTEND ROUTE)
router.get("/questions-by-domains/:domainNames", async (req, res) => {
  console.log('GET questions-by-domains hit with:', req.params.domainNames);
  try {
    const domainNamesStr = decodeURIComponent(req.params.domainNames);
    const domainNames = domainNamesStr.split(',').map(name => name.trim());

    // Find domains by names (case-insensitive to avoid data-entry mismatch issues)
    const nameRegexes = domainNames.map((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    const domains = await Domain.find({ domain_name: { $in: nameRegexes } });
    if (domains.length === 0) {
      return res.status(404).json({ error: "No domains found" });
    }

    const domainIds = domains.map(d => d._id);

    // Find all questions in these domains (optionally restrict to one assessment type)
    const { assessment_type_id } = req.query;
    const qfilter = { domain_id: { $in: domainIds } };
    if (assessment_type_id) {
      qfilter.assessment_type_id = assessment_type_id;
    }
    let questions = await Question.find(qfilter);

    // If caller requested a specific assessment type but no question matched,
    // try a domain-level fallback for records where domain was specialized but
    // question.assessment_type_id was not set consistently.
    if (assessment_type_id && questions.length === 0) {
      const preferredDomainIds = domains
        .filter((d) => String(d.assessment_type_id || '') === String(assessment_type_id))
        .map((d) => d._id);

      if (preferredDomainIds.length > 0) {
        questions = await Question.find({ domain_id: { $in: preferredDomainIds } });
      } else {
        // Final fallback: return domain questions even if assessment_type mapping is inconsistent.
        questions = await Question.find({ domain_id: { $in: domainIds } });
      }
    }

    // Transform to include options from OptionSet
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        // Fetch options specifically for this question
        let options = await Option.find({ question_id: question._id }).sort({ order: 1 });

        // Fallback: If no question-specific options exist, check if we can fetch from the OptionSet template
        if (options.length === 0 && question.option_set_id) {
          // Fetch options that belong to the set but are NOT assigned to a specific question (template options)
          options = await Option.find({ option_set_id: question.option_set_id, question_id: null }).sort({ order: 1 });
        }

        return {
          _id: question._id,
          question_text: question.question_text,
          domain_id: question.domain_id,
          assessment_type_id: question.assessment_type_id,
          weight: question.weight,
          options: options
        };
      })
    );

    res.json(questionsWithOptions);
  } catch (err) {
    console.error('ERROR FETCHING QUESTIONS:', err);
    res.status(500).json({
      error: "Failed to fetch questions",
      details: err.message,
      stack: err.stack
    });
  }
});

// GET all domains
router.get("/", async (req, res) => {
  try {
    const domains = await Domain.find().populate("assessment_type_id");
    res.json(domains);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch domains" });
  }
});

// POST create new domain
router.post("/", protect, admin, async (req, res) => {
  try {
    console.log('Creating domain:', req.body);
    console.log('User from auth:', req.user);
    
    const domain = new Domain(req.body);
    await domain.save();
    
    console.log('Domain created successfully:', domain);
    res.status(201).json(domain);
  } catch (err) {
    console.error('Domain creation error:', err);
    res.status(500).json({ 
      message: "Failed to create domain",
      error: err.message 
    });
  }
});

// DELETE domain
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const domainId = req.params.id;

    // Find all questions in this domain
    const questions = await Question.find({ domain_id: domainId });
    const questionIds = questions.map(q => q._id);

    // Delete all options associated with these questions
    await Option.deleteMany({ question_id: { $in: questionIds } });

    // Delete all questions
    await Question.deleteMany({ domain_id: domainId });

    // Delete the domain
    await Domain.findByIdAndDelete(domainId);

    res.json({ message: "Domain and related data deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete domain" });
  }
});

export default router;
