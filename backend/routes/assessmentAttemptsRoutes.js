import express from "express";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import Answer from "../models/Answer.js";
import Option from "../models/Option.js";
import User from "../models/User.js";
import AssessmentType from "../models/AssessmentType.js";
import { protect } from "../middleware/authMiddleware.js";
import Domain from "../models/Domain.js";
import Question from "../models/Question.js";
import Score from "../models/Score.js";
import Category from "../models/Category.js";
import { getCategoryForScore } from "../models/utils/calculateScore.js";
import nodemailer from "nodemailer";

const router = express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const canSendEmail = () => {
  return Boolean(
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const buildResultEmailHtml = ({ name, attemptedAt, results, profile }) => {
  const domainRows = (results.domain_scores || [])
    .map(
      (d) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${d.domain_name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${(d.normalized_score || 0).toFixed(1)}%</td>
          <td style="padding:8px;border:1px solid #ddd;">${d.score}/${d.max_score}</td>
        </tr>`
    )
    .join("");

  const recommendations = (results.recommendations || [])
    .map((r) => `<li><strong>${r.test_name}:</strong> ${r.reason}</li>`)
    .join("");

  const profileRows = [
    name ? `<li><strong>Name:</strong> ${name}</li>` : "",
    profile?.gender ? `<li><strong>Gender:</strong> ${profile.gender}</li>` : "",
    profile?.location ? `<li><strong>Location:</strong> ${profile.location}</li>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
      <h2 style="margin-bottom:8px;">Your MindCare Assessment Results</h2>
      <p style="margin-top:0;">Hello ${name || "there"}, here is a copy of your latest assessment summary.</p>
      <p><strong>Date:</strong> ${attemptedAt}</p>
      <p><strong>Overall Risk:</strong> ${results.risk_level}</p>
      <p><strong>Wellbeing:</strong> ${(100 - (results.overall_normalized_score || 0)).toFixed(1)}%</p>
      ${profileRows ? `<h3 style="margin-top:16px;margin-bottom:8px;">Profile</h3><ul>${profileRows}</ul>` : ""}

      <h3 style="margin-bottom:8px;">Domain Breakdown</h3>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border:1px solid #ddd;background:#f7f7f7;">Domain</th>
            <th style="text-align:left;padding:8px;border:1px solid #ddd;background:#f7f7f7;">Score (%)</th>
            <th style="text-align:left;padding:8px;border:1px solid #ddd;background:#f7f7f7;">Points</th>
          </tr>
        </thead>
        <tbody>${domainRows}</tbody>
      </table>

      ${recommendations ? `<h3 style="margin-top:16px;margin-bottom:8px;">Recommendations</h3><ul>${recommendations}</ul>` : ""}
      <p style="margin-top:16px;color:#555;">This email was sent because you selected "Email me a copy of my results" in MindCare.</p>
    </div>
  `;
};

const sendAssessmentEmail = async ({ to, name, attemptedAt, results, profile }) => {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Your MindCare Assessment Results",
    text: `Hello ${name || "there"},\n\nYour risk level is ${results.risk_level}.\nWellbeing: ${(100 - (results.overall_normalized_score || 0)).toFixed(1)}%${profile?.gender ? `\nGender: ${profile.gender}` : ""}${profile?.location ? `\nLocation: ${profile.location}` : ""}\n\nThank you for using MindCare.`,
    html: buildResultEmailHtml({ name, attemptedAt, results, profile })
  });
};

// @desc    Get student's assessment history (includes score details)
router.get("/history", protect, async (req, res) => {
  try {
    // grab attempts, then join with Score docs to shape them as front-end expects
    const attempts = await AssessmentAttempt.find({ student_id: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // early exit when there are no attempts
    if (!attempts.length) {
      return res.json([]);
    }

    // fetch corresponding scores
    const attemptIds = attempts.map(a => a._id);
    const scoreDocs = await Score.find({ attempt_id: { $in: attemptIds } }).lean();
    const scoreMap = {};
    scoreDocs.forEach(s => {
      scoreMap[s.attempt_id.toString()] = s;
    });

    // helper for computing level (duplicate from front-end assessment util)
    const computeLevel = (percentage) => {
      if (percentage < 25) return { label: 'Low', color: '#4CAF50' };
      if (percentage < 50) return { label: 'Mild', color: '#FFC107' };
      if (percentage < 75) return { label: 'Moderate', color: '#FF9800' };
      return { label: 'High', color: '#F44336' };
    };

    const formatted = attempts.map(a => {
      const s = scoreMap[a._id.toString()];
      let domainScores = {};
      let wellbeing = null;
      if (s) {
        s.domain_scores.forEach(ds => {
          // try to normalize the domain name into a lowercase slug; fall back to id string
          const rawName = ds.domain_name || '';
          const slug = rawName.trim().toLowerCase().replace(/\s+/g, '_');
          const key = slug || (ds.domain_id ? ds.domain_id.toString() : '');
          domainScores[key] = {
            score: ds.score,
            max: ds.max_score,
            percentage: ds.normalized_score,
            level: computeLevel(ds.normalized_score)
          };
        });
        wellbeing = 100 - (s.overall_normalized_score || 0);
      }
      return {
        id: a._id,
        createdAt: a.createdAt,
        wellbeing,
        domainScores
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('History fetch error', err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

// @desc    Submit assessment attempt
router.post("/", async (req, res) => {
  try {
    const { user, answers: screenAnswers, assessment_type_id } = req.body;

    if (!screenAnswers) {
      throw new Error('Answers are missing from request body');
    }

    let studentId;
    let studentDisplayName;
    // prefer token-based identity if protected middleware attached user
    if (req.user && req.user._id) {
      studentId = req.user._id;
      studentDisplayName = req.user.name || req.user.email || 'Unknown';
      // make sure display_name persists in DB
      if (req.user && !req.user.display_name) {
        req.user.display_name = studentDisplayName;
        await req.user.save();
      }
    } else if (user && user._id) {
      // Logged-in user provided in body (older clients)
      studentId = user._id;
      const loggedInUser = await User.findById(user._id);
      studentDisplayName = loggedInUser?.name || user.name || user.email || 'Unknown';
      if (loggedInUser && !loggedInUser.display_name) {
        loggedInUser.display_name = studentDisplayName;
        await loggedInUser.save();
      }
    } else {
      // Anonymous user - create unique User_XXXX identity per submission
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const anonDisplayName = `User_${randomId}`;
      const anonEmail = `anon_${Date.now()}_${randomId}@mindcare.com`;
      const anonUser = new User({
        name: anonDisplayName,
        display_name: anonDisplayName,
        email: anonEmail,
        password: `anon_${Date.now()}`,
        role: 'student'
      });
      await anonUser.save();
      studentId = anonUser._id;
      studentDisplayName = anonDisplayName;
    }

    // Flatten answers from screens
    const allAnswers = {
      ...(screenAnswers.screen1 || {}),
      ...(screenAnswers.screen2 || {}),
      ...(screenAnswers.screen3 || {})
    };

    if (screenAnswers.dynamic && typeof screenAnswers.dynamic === 'object') {
      Object.values(screenAnswers.dynamic).forEach((screenData) => {
        if (screenData && typeof screenData === 'object') {
          Object.assign(allAnswers, screenData);
        }
      });
    }

    const optionalData = screenAnswers.optional || {};
    const optionalProfile = {
      gender: String(optionalData.gender || "").trim(),
      location: String(optionalData.location || "").trim()
    };

    const questionIds = Object.keys(allAnswers);
    const questions = await Question.find({ _id: { $in: questionIds } }).populate("domain_id");

    // Preload options once to avoid N+1 queries while computing max points.
    const optionSetIds = [
      ...new Set(
        questions
          .map((q) => (q.option_set_id ? q.option_set_id.toString() : null))
          .filter(Boolean)
      )
    ];

    const optionsForScoring = await Option.find({
      $or: [
        { question_id: { $in: questionIds } },
        { question_id: null, option_set_id: { $in: optionSetIds } }
      ]
    })
      .select("question_id option_set_id points")
      .lean();

    const questionMaxMap = new Map();
    const optionSetMaxMap = new Map();

    optionsForScoring.forEach((opt) => {
      const points = Number(opt.points || 0);
      if (opt.question_id) {
        const key = opt.question_id.toString();
        const prev = questionMaxMap.get(key) || 0;
        if (points > prev) questionMaxMap.set(key, points);
      } else if (opt.option_set_id) {
        const key = opt.option_set_id.toString();
        const prev = optionSetMaxMap.get(key) || 0;
        if (points > prev) optionSetMaxMap.set(key, points);
      }
    });

    // Group answers by domain
    const domainData = {};
    for (const q of questions) {
      if (!q.domain_id) {
        console.warn(`Question ${q._id} has no domain_id`);
        continue;
      }

      const d = q.domain_id;
      const domainId = (d._id || d).toString();
      const domainName = d.domain_name || "General";

      if (!domainData[domainId]) {
        domainData[domainId] = {
          domain_id: domainId,
          domain_name: domainName,
          questions: [],
          total_points: 0,
          max_points: 0
        };
      }

      const answer = allAnswers[q._id.toString()];
      if (!answer) continue;

      domainData[domainId].questions.push({
        question_id: q._id,
        points: answer.points,
        option_id: answer.option_id
      });

      domainData[domainId].total_points += (answer.points || 0);

      const qid = q._id.toString();
      const setId = q.option_set_id ? q.option_set_id.toString() : null;
      const maxQPoints = questionMaxMap.get(qid) || (setId ? optionSetMaxMap.get(setId) || 0 : 0);
      domainData[domainId].max_points += maxQPoints;
    }

    // Calculate domain scores and normalized scores
    const domain_scores = Object.values(domainData).map(d => ({
      domain_id: d.domain_id,
      domain_name: d.domain_name,
      score: d.total_points,
      max_score: d.max_points,
      normalized_score: d.max_points > 0 ? (d.total_points / d.max_points) * 100 : 0
    }));

    const total_score = domain_scores.reduce((sum, d) => sum + d.score, 0);
    const maximum_total_score = domain_scores.reduce((sum, d) => sum + d.max_score, 0);
    const overall_normalized_score = maximum_total_score > 0 ? (total_score / maximum_total_score) * 100 : 0;

    // Determine finalTypeId early
    let finalTypeId = assessment_type_id;
    if (!finalTypeId) {
      const generalType = await AssessmentType.findOne({ name: /General/i });
      if (generalType) {
        finalTypeId = generalType._id;
      } else {
        const firstType = await AssessmentType.findOne();
        finalTypeId = firstType ? firstType._id : undefined;
      }
    }

    if (!finalTypeId) {
      throw new Error('Could not determine assessment type ID');
    }

    const attemptCategory = await getCategoryForScore(finalTypeId, overall_normalized_score);

    let risk_level = attemptCategory ? attemptCategory.label : "Unknown Risk";
    const recommendations = [];

    // Fallback recommendation if category has one
    if (attemptCategory && attemptCategory.recommendation_text) {
      recommendations.push({
        test_name: "Overall Well-being",
        reason: attemptCategory.recommendation_text
      });
    }

    const highCategory = await Category.findOne({ assessment_type_id: finalTypeId, label: /High/i });
    const highRiskThreshold = highCategory ? highCategory.min_score : 75;

    domain_scores.forEach(ds => {
      if (ds.normalized_score >= highRiskThreshold) {
        recommendations.push({
          test_name: ds.domain_name,
          reason: `We've noticed a high risk in your ${ds.domain_name} score (${ds.normalized_score.toFixed(1)}%). We recommend a specialized ${ds.domain_name} test.`
        });
      }
    });

    // Save AssessmentAttempt
    const attempt = new AssessmentAttempt({
      student_id: studentId,
      assessment_type_id: finalTypeId,
      total_score: total_score,
      category_id: attemptCategory ? attemptCategory._id : undefined,
      createdAt: new Date()
    });
    await attempt.save();

    // Save Answers
    const answerDocs = Object.entries(allAnswers)
      .filter(([qId, data]) => data && typeof data === 'object' && data.option_id)
      .map(([qId, data]) => ({
        attempt_id: attempt._id,
        question_id: qId,
        option_id: data.option_id,
        points_awarded: data.points || 0
      }));
    if (answerDocs.length > 0) {
      await Answer.insertMany(answerDocs);
    }

    // Save Score details
    const scoreDoc = new Score({
      attempt_id: attempt._id,
      total_score,
      maximum_total_score,
      overall_normalized_score,
      risk_level,
      domain_scores,
      recommendations
    });
    await scoreDoc.save();

    const results = {
      total_score,
      maximum_total_score,
      overall_normalized_score,
      risk_level,
      domain_scores,
      recommendations
    };

    let emailStatus = {
      requested: Boolean(optionalData.emailCopy),
      sent: false,
      reason: null
    };

    if (optionalData.emailCopy) {
      const targetEmail = String(optionalData.email || "").trim();
      if (!targetEmail) {
        emailStatus.reason = "Email copy requested but no email address provided.";
      } else if (!isValidEmail(targetEmail)) {
        emailStatus.reason = "Invalid email address format.";
      } else if (!canSendEmail()) {
        emailStatus.reason = "Email service is not configured on the server. Set at least SMTP_USER and SMTP_PASS in backend/.env.";
      } else {
        try {
          const attemptedAt = new Date(attempt.createdAt || Date.now()).toLocaleString();
          await sendAssessmentEmail({
            to: targetEmail,
            name: studentDisplayName,
            attemptedAt,
            results,
            profile: optionalProfile
          });
          emailStatus.sent = true;
        } catch (emailErr) {
          console.error("Failed to send assessment email:", emailErr.message);
          emailStatus.reason = `Failed to send email copy: ${emailErr.message}`;
        }
      }
    }

    res.json({
      success: true,
      attempt_id: attempt._id,
      results,
      emailStatus
    });
  } catch (err) {
    console.error('Error submitting assessment:', err.message);
    res.status(500).json({
      error: 'Failed to process assessment results',
      details: err.message
    });
  }
});

// @desc    Get average scores (RESTORED FRONTEND COMPATIBILITY)
router.get("/analytics/averages", async (req, res) => {
  try {
    // join attempts with their score documents and unwind domain_scores
    const results = await AssessmentAttempt.aggregate([
      {
        $lookup: {
          from: "scores",
          localField: "_id",
          foreignField: "attempt_id",
          as: "scoreDoc"
        }
      },
      { $unwind: "$scoreDoc" },
      { $unwind: "$scoreDoc.domain_scores" },
      {
        $group: {
          _id: {
            domain: "$scoreDoc.domain_scores.domain_id",
            type: "$assessment_type_id"
          },
          avgScore: { $avg: "$scoreDoc.domain_scores.score" }
        }
      }
    ]);

    // transform aggregation into frontend-friendly map
    const averages = {};
    results.forEach(r => {
      const domainId = r._id.domain.toString();
      const typeId = r._id.type.toString();
      averages[`${domainId}-${typeId}`] = r.avgScore;
    });

    res.json(averages);
  } catch (err) {
    console.error('Error computing averages:', err);
    res.status(500).json({ error: "Error fetching averages" });
  }
});

export default router;

