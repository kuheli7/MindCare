
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './backend/models/Question.js';
import Domain from './backend/models/Domain.js';
import Option from './backend/models/Option.js';
import AssessmentType from './backend/models/AssessmentType.js';

dotenv.config({ path: 'backend/.env' });

const testSubmit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const questions = await Question.find().limit(5).populate('domain_id');
        if (questions.length === 0) {
            console.error('No questions found');
            process.exit(1);
        }

        const answers = {
            screen1: {},
            screen2: {},
            screen3: {}
        };

        for (const q of questions) {
            const options = await Option.find({
                $or: [{ option_set_id: q.option_set_id }, { question_id: q._id }]
            });
            if (options.length > 0) {
                // Determine a safe screen to put it in
                answers.screen1[q._id] = {
                    points: options[0].points,
                    option_id: options[0]._id
                };
            }
        }

        console.log('Sending test submission...');
        try {
            const res = await fetch('http://localhost:5000/api/assessment-attempts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: { _id: "676f8e7b1234567890abcdef" }, // dummy id
                    answers: answers
                })
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                console.log('Response:', JSON.stringify(data, null, 2));
            } catch (e) {
                console.log('Raw Response:', text);
            }
        } catch (err) {
            console.error('Fetch Error:', err);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Script Error:', err);
    }
};

testSubmit();
