import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const hasLineBreak = (value) => /[\r\n]/.test(String(value || ""));
const MAX_NAME_LENGTH = 80;
const MIN_SUBJECT_LENGTH = 3;
const MAX_SUBJECT_LENGTH = 120;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const canSendEmail = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

router.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ message: `Name must be between 2 and ${MAX_NAME_LENGTH} characters.` });
    }

    if (subject.length < MIN_SUBJECT_LENGTH || subject.length > MAX_SUBJECT_LENGTH) {
      return res.status(400).json({
        message: `Subject must be between ${MIN_SUBJECT_LENGTH} and ${MAX_SUBJECT_LENGTH} characters.`
      });
    }

    if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`
      });
    }

    if (hasLineBreak(name) || hasLineBreak(email) || hasLineBreak(subject)) {
      return res.status(400).json({ message: "Invalid characters were found in your request." });
    }

    if (!canSendEmail()) {
      return res.status(500).json({
        message: "Contact email service is not configured. Please set SMTP_USER and SMTP_PASS in backend/.env."
      });
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const contactTarget = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER;

    if (!isValidEmail(contactTarget)) {
      return res.status(500).json({
        message: "Contact receiver email is invalid. Please set CONTACT_RECEIVER_EMAIL in backend/.env."
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

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
      to: contactTarget,
      replyTo: email,
      subject: `[MindCare Contact] ${subject}`,
      text: `New contact message from MindCare\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.55;color:#222;">
          <h2 style="margin-bottom:10px;">New MindCare Contact Message</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <h3 style="margin-bottom:8px;">Message</h3>
          <p style="white-space:pre-wrap;">${safeMessage}</p>
        </div>
      `
    });

    // Optional confirmation email to sender
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: "We received your message - MindCare",
        text: `Hi ${name},\n\nThanks for contacting MindCare. We received your message and will get back to you soon.\n\nSubject: ${subject}\n\nBest,\nMindCare Team`
      });
    } catch (confirmationErr) {
      console.warn("Contact confirmation email failed:", confirmationErr.message);
    }

    return res.json({ success: true, message: "Message sent successfully.", routedTo: contactTarget });
  } catch (err) {
    console.error("Contact form error:", err.message);
    return res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
});

export default router;
