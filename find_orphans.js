
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './backend/models/Question.js';
import Domain from './backend/models/Domain.js';

dotenv.config({ path: 'backend/.env' });

const findOrphanQuestions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const questions = await Question.find().populate('domain_id');
        const orphans = questions.filter(q => !q.domain_id);

        console.log('Orphan Questions found:', orphans.length);
        for (const q of orphans) {
            console.log(`- ID: ${q._id}, Text: ${q.question_text}, Raw Domain ID: ${q.domain_id}`);
            // Check if the raw domain ID exists
            const rawQ = await Question.findById(q._id);
            const domainExists = await Domain.findById(rawQ.domain_id);
            console.log(`  Raw Domain ID from DB: ${rawQ.domain_id}, Exists in Domains: ${!!domainExists}`);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

findOrphanQuestions();
