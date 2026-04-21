
import mongoose from 'mongoose';
import AssessmentAttempt from './backend/models/AssessmentAttempt.js';
import Score from './backend/models/Score.js';
import User from './backend/models/User.js';
import Answer from './backend/models/Answer.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare');
        console.log('Connected to MongoDB');

        const attempts = await AssessmentAttempt.find().lean();
        console.log(`\n--- AssessmentAttempts (${attempts.length}) ---`);
        for (const attempt of attempts) {
            const user = await User.findById(attempt.student_id);
            const score = await Score.findOne({ attempt_id: attempt._id });
            const answers = await Answer.find({ attempt_id: attempt._id });

            console.log(`ID: ${attempt._id} | User: ${user ? (user.display_name || user.name) : 'MISSING'} | Score: ${score ? 'FOUND' : 'MISSING'} | Answers: ${answers.length} | Date: ${attempt.createdAt}`);

            if (!user) console.log(`   [!] Orphaned from user: student_id ${attempt.student_id} not found`);
            if (!score) console.log(`   [!] Incomplete: Score missing for this attempt`);
        }

        const scores = await Score.find().lean();
        console.log(`\n--- Scores (${scores.length}) ---`);
        for (const score of scores) {
            const attempt = await AssessmentAttempt.findById(score.attempt_id);
            if (!attempt) {
                console.log(`ID: ${score._id} | Attempt ID: ${score.attempt_id} | [!] Orphaned: Parent attempt not found`);
            }
        }

        const answers = await Answer.find().lean();
        console.log(`\n--- Answers (Total: ${answers.length}) ---`);
        const attemptIds = [...new Set(answers.map(a => a.attempt_id.toString()))];
        for (const id of attemptIds) {
            const attempt = await AssessmentAttempt.findById(id);
            if (!attempt) {
                const count = answers.filter(a => a.attempt_id.toString() === id).length;
                console.log(`Attempt ID: ${id} | [!] Orphaned Answers: ${count} found without parent attempt`);
            }
        }

    } catch (err) {
        console.error('Inspection error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
