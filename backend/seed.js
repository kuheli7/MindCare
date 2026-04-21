import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import AssessmentType from "./models/AssessmentType.js";
import Domain from "./models/Domain.js";
import Question from "./models/Question.js";
import Option from "./models/Option.js";
import OptionSet from "./models/OptionSet.js";
import Category from "./models/Category.js";

dotenv.config();
if (!process.env.MONGO_URI) {
    dotenv.config({ path: 'backend/.env' });
}

const seed = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB...");

        await User.deleteMany({});
        await AssessmentType.deleteMany({});
        await Domain.deleteMany({});
        await Question.deleteMany({});
        await Option.deleteMany({});
        await OptionSet.deleteMany({});
        await Category.deleteMany({});

        console.log("Cleared old data. Creating Users...");
        await User.create([
            { name: "Admin User", email: "admin@mindcare.com", password: "adminpassword", role: "admin" },
            { name: "John Student", email: "student@mindcare.com", password: "studentpassword", role: "student" },
            { name: "Guest", email: "guest@mindcare.com", password: "guestpassword", role: "student" }
        ]);

        console.log("Creating Assessment Types...");
        const general = await AssessmentType.create({
            name: "General Wellness",
            description: "A preliminary scan of your mental well-being.",
            isSpecialized: false
        });

        const specialized = await AssessmentType.create({
            name: "Specialized Assessment",
            description: "In-depth clinical evaluation.",
            isSpecialized: true
        });

        console.log("Creating Option Sets...");
        const likert5 = await OptionSet.create({
            set_name: "Likert Scale 5 (Never-Always)",
            description: "Standard 0-4 scale for frequency"
        });

        const likert5Options = [
            { text: "Never", points: 0, order: 0 },
            { text: "Rarely", points: 1, order: 1 },
            { text: "Sometimes", points: 2, order: 2 },
            { text: "Often", points: 3, order: 3 },
            { text: "Almost Always", points: 4, order: 4 }
        ];

        for (const opt of likert5Options) {
            await Option.create({
                option_set_id: likert5._id,
                option_text: opt.text,
                points: opt.points,
                order: opt.order
            });
        }

        const sleepScale4 = await OptionSet.create({
            set_name: "Sleep Scale 4 (Past Month)",
            description: "Standard 0-3 scale for sleep frequency"
        });

        const sleepOptions = [
            { text: "Not during the past month", points: 0, order: 0 },
            { text: "Less than once a week", points: 1, order: 1 },
            { text: "Once or twice a week", points: 2, order: 2 },
            { text: "Three or more times a week", points: 3, order: 3 }
        ];

        for (const opt of sleepOptions) {
            await Option.create({
                option_set_id: sleepScale4._id,
                option_text: opt.text,
                points: opt.points,
                order: opt.order
            });
        }

        console.log("Creating Domains...");
        const domains = [
            {
                name: "Stress", color: "#FF8F8F", questions: [
                    "In the last month, how often have you felt nervous and stressed?",
                    "In the last month, how often have you found that you could not cope with all the things that you had to do?",
                    "You feel that too many demands are being made on you",
                    "You have many worries"
                ]
            },
            {
                name: "Anxiety", color: "#f6ad55", questions: [
                    "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)",
                    "I felt I was close to panic",
                    "In the last three months, have you found that it's hard to stop yourself from worrying?",
                    "Feeling afraid, as if something awful might happen"
                ]
            },
            {
                name: "Depression", color: "#9f7aea", questions: [
                    "I couldn't seem to experience any positive feeling at all",
                    "I found it difficult to work up the initiative to do things",
                    "I felt that I had nothing to look forward to",
                    "I felt down-hearted and blue"
                ]
            },
            {
                name: "Burnout", color: "#ed8936", questions: [
                    "I feel like a failure",
                    "I feel emotionally exhausted from my work/studies",
                    "I feel used up at the end of the day",
                    "I feel burned out from my work/studies"
                ]
            },
            {
                name: "Sleep", color: "#4299e1", questions: [
                    "During the past month, how would you rate your sleep quality overall?",
                    "During the past month, how often have you had trouble sleeping?",
                    "During the past month, how often have you taken medicine to help you sleep?",
                    "During the past month, how often have you had trouble staying awake?"
                ]
            }
        ];

        for (const d of domains) {
            const createdDomain = await Domain.create({
                assessment_type_id: general._id,
                domain_name: d.name,
                color: d.color
            });

            const setId = d.name === "Sleep" ? sleepScale4._id : likert5._id;

            for (let i = 0; i < d.questions.length; i++) {
                await Question.create({
                    domain_id: createdDomain._id,
                    assessment_type_id: general._id,
                    question_text: d.questions[i],
                    option_set_id: setId,
                    order: i + 1,
                    weight: 1
                });
            }
        }

        console.log("Creating Categories...");
        await Category.create([
            { assessment_type_id: general._id, min_score: 0, max_score: 39, label: "Low Risk", recommendation_text: "You are doing well. Maintain your healthy habits!" },
            { assessment_type_id: general._id, min_score: 40, max_score: 69, label: "Medium Risk", recommendation_text: "Your well-being is impacted. Speaking with a counselor might help." },
            { assessment_type_id: general._id, min_score: 70, max_score: 100, label: "High Risk", recommendation_text: "You are in a high-risk zone. Please seek professional help immediately." }
        ]);

        console.log("Seed Complete!");
        process.exit(0);
    } catch (err) {
        console.error("SEED FAILED", err);
        process.exit(1);
    }
};
seed();
