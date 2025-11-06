
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Question from '../src/models/Question.js';

// Load env vars
dotenv.config({ path: './backend/.env' });

// Connect to database
connectDB();

const countQuestionsWithExplanation = async () => {
  try {
    const count = await Question.countDocuments({
      $and: [
        {
          $or: [
            { "explanation.text": { $exists: true, $ne: "" } },
            { "explanation.image": { $exists: true, $ne: null } }
          ]
        },
        { "unit_no": { $exists: true, $ne: "" } },
        { "topic": { $exists: true, $ne: "" } },
        { "options.isCorrect": true }
      ]
    });

    console.log(`Number of questions with non-empty explanation, unit_no, topic, and a correct answer: ${count}`);
  } catch (error) {
    console.error('Error counting questions:', error);
  } finally {
    mongoose.disconnect();
  }
};

countQuestionsWithExplanation();
