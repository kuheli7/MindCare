import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import domainsRoutes from "./routes/domainsRoutes.js";
import assessmentTypeRoutes from "./routes/assessmentTypeRoutes.js";
import assessmentAttemptsRoutes from "./routes/assessmentAttemptsRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import optionRoutes from "./routes/optionRoutes.js"; // RESTORED
import optionSetRoutes from "./routes/optionSetRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: 'backend/.env' });
}
if (!process.env.MONGO_URI) {
  dotenv.config({ path: '.env' });
}

const app = express();

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 500, // Increased for development
//   message: { message: "Too many requests from this IP, please try again in 15 minutes." }
// });
// app.use("/api/", limiter);

// Routes Middleware - RESTORED ORIGINAL PATHS
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/domains", domainsRoutes);
app.use("/api/assessment-types", assessmentTypeRoutes);
app.use("/api/assessment-attempts", assessmentAttemptsRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/option-sets", optionSetRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("MindCare API is running...");
});

// Error Handling
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
