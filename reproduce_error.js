
import mongoose from 'mongoose';
import Domain from './backend/models/Domain.js';
import Question from './backend/models/Question.js';
import Option from './backend/models/Option.js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function reproduce() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mindcare');
        console.log('Connected');

        const domainNames = ['Stress', 'Anxiety'];
        const domains = await Domain.find({ domain_name: { $in: domainNames } });
        console.log('Domains found:', domains.length);

        const domainIds = domains.map(d => d._id);
        const questions = await Question.find({ domain_id: { $in: domainIds } });
        console.log('Questions found:', questions.length);

        const questionsWithOptions = await Promise.all(
            questions.map(async (question) => {
                try {
                    console.log(`Processing question: ${question._id}`);
                    let options = await Option.find({ question_id: question._id }).sort({ order: 1 });

                    if (options.length === 0 && question.option_set_id) {
                        options = await Option.find({ option_set_id: question.option_set_id, question_id: null }).sort({ order: 1 });
                    }
                    return { ...question.toObject(), options };
                } catch (e) {
                    console.error(`Error in map for question ${question._id}:`, e);
                    throw e;
                }
            })
        );

        console.log('Success! Questions with options:', questionsWithOptions.length);

    } catch (err) {
        console.error('REPRODUCTION ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
