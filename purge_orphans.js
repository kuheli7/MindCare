
import mongoose from 'mongoose';
import AssessmentAttempt from './backend/models/AssessmentAttempt.js';
import Score from './backend/models/Score.js';
import User from './backend/models/User.js';
import Answer from './backend/models/Answer.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare');
        console.log('Connected to MongoDB');

        // 1. Find all attempts
        const attempts = await AssessmentAttempt.find();
        console.log(`Initial AssessmentAttempts: ${attempts.length}`);

        let deletedAttempts = 0;
        let deletedScores = 0;
        let deletedAnswers = 0;

        for (const attempt of attempts) {
            const user = await User.findById(attempt.student_id);
            const score = await Score.findOne({ attempt_id: attempt._id });

            // If user is missing OR score is missing, this is an orphaned/incomplete record
            if (!user || !score) {
                console.log(`Cleaning up orphaned attempt: ${attempt._id} (User: ${!!user}, Score: ${!!score})`);

                // Delete the attempt
                await AssessmentAttempt.findByIdAndDelete(attempt._id);
                deletedAttempts++;

                // Delete associated answers
                const ansResult = await Answer.deleteMany({ attempt_id: attempt._id });
                deletedAnswers += ansResult.deletedCount;

                // Delete associated score if it existed but user didn't
                if (!user && score) {
                    await Score.findByIdAndDelete(score._id);
                    deletedScores++;
                }
            }
        }

        // 2. Find any scores without attempts
        const scores = await Score.find();
        for (const score of scores) {
            const attempt = await AssessmentAttempt.findById(score.attempt_id);
            if (!attempt) {
                console.log(`Cleaning up orphaned score: ${score._id} (Parent attempt missing)`);
                await Score.findByIdAndDelete(score._id);
                deletedScores++;
            }
        }

        // 3. Find any answers without attempts
        const answers = await Answer.find();
        const uniqueAttemptIdsInAnswers = [...new Set(answers.map(a => a.attempt_id.toString()))];
        for (const attemptId of uniqueAttemptIdsInAnswers) {
            const attempt = await AssessmentAttempt.findById(attemptId);
            if (!attempt) {
                console.log(`Cleaning up orphaned answers for attempt: ${attemptId}`);
                const result = await Answer.deleteMany({ attempt_id: attemptId });
                deletedAnswers += result.deletedCount;
            }
        }

        console.log('\n--- Cleanup Results ---');
        console.log(`Deleted Attempts: ${deletedAttempts}`);
        console.log(`Deleted Scores: ${deletedScores}`);
        console.log(`Deleted Answers: ${deletedAnswers}`);

    } catch (err) {
        console.error('Cleanup error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
