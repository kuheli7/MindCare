# MindCare – Student Mental Well-Being Monitoring System

MindCare is a production-ready web application designed to monitor and support student mental health through assessments and personalized recommendations.

## 🚀 System Overview

- **Three-Tier Architecture**: React Frontend -> Express/Node Backend -> MongoDB Database.
- **Role-Based Access**: Specialized views for Students and Admins.
- **Rule-Based Scoring**: Automatic risk categorization based on assessment results.
- **Recommendation Engine**: Intelligent suggestions for follow-up specialized assessments.

## 🛠 Technology Stack

### Backend
- **Node.js & ExpressJS**: Robust API layer.
- **MongoDB & Mongoose**: Flexible document storage with schema validation.
- **JWT Authentication**: Secure stateless authentication.
- **Bcrypt**: Industrial-strength password hashing.
- **Security**: Helmet, Rate Limiter, and input validation.

### Frontend
- **ReactJS & Vite**: Blazing fast development and build.
- **TailwindCSS**: Modern, responsive styling.
- **Recharts**: Data visualization for wellness trends.
- **Framer Motion**: Smooth animations for a calm user experience.

## 📂 Project Structure

- `backend/`: Node.js server and API logic.
  - `models/`: Mongoose schemas.
  - `routes/`: Express API endpoints.
  - `middleware/`: Auth and error handling.
  - `services/`: Business logic like the Recommendation Engine.
- `src/`: React frontend source code.

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js installed.
- MongoDB Atlas account or local MongoDB instance.

### 2. Backend Setup
1. Navigate to the projects root or backend directory.
2. Edit `.env` file with your `MONGO_URI` and `JWT_SECRET`.
3. Install dependencies: `npm install`
4. Seed the database with sample data: `node backend/seed.js`
5. Start the server: `npm run dev` (or `node backend/server.js`)

### 3. Frontend Setup
1. The frontend is integrated into the root.
2. Run `npm install` if not done.
3. Start the dev server: `npm run dev`.

## 🛡 Security & Best Practices
- **Input Sanitization**: All inputs are validated to prevent injection.
- **CORS Configuration**: Restricted to verified origins.
- **Rate Limiting**: Protected against brute-force and DDoS.
- **Secure Headers**: Using Helmet to set various HTTP headers.

## 📈 Analytics & Flow
1. **Student Registration**: Users register and can immediately take a General Assessment.
2. **Logic Engine**: Scores are totaled across domains; categories (Low/Medium/High) are assigned.
3. **Recommendations**: If specific triggers are met, the system gently suggests specialized tests (Stress, Sleep, etc.).
4. **Admin Panel**: Admins can manage the content and view system-wide analytics on student wellness trends.

---
*MindCare – Caring for the minds that shape the future.*
