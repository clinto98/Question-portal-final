import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../src/models/Question.js";
import Demo from "../src/models/Demo.js";
import QuestionPaper from "../src/models/QuestionPaper.js";
import Course from "../src/models/Course.js";

dotenv.config({ path: './backend/.env' });

const migrateQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const questionsToMigrate = await Question.find({
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
          ],
      }).populate("course questionPaper").session(session);

      console.log(`Found ${questionsToMigrate.length} questions to migrate.`);

      for (const question of questionsToMigrate) {
        const sourcePaper = question.questionPaper;
        const correctOption = question.options.find(option => option.isCorrect);

        const newQuestionPayload = {
          question: question.question.text,
          options: question.options.map(o => ({
            text: o.text,
            diagramUrl: o.image,
          })),
          correctAnswer: correctOption ? {
              text: correctOption.text,
              diagramUrl: correctOption.image,
          } : {text: "", diagramUrl: null},
          diagramUrl: question.question.image,
          explanation: question.explanation.text,
          explanationImageUrl: question.explanation.image,
          keywords: question.keywords,
          unit: question.unit,
          unit_no: question.unit_no,
          topic: question.topic,
          difficulty: question.complexity,
          FrequentlyAsked: question.FrequentlyAsked,
        };

        const newDemoPaper = new Demo({
          examYear: sourcePaper.questionPaperYear,
          examType: sourcePaper.examType,
          subject: sourcePaper.subject,
          syllabus: sourcePaper.syllabus,
          standard: sourcePaper.standard,
          paperName: sourcePaper.name,
          sourceType: 'PDF',
          questions: [newQuestionPayload],
          course: question.course._id,
        });

        await newDemoPaper.save({ session });
        console.log(`Migrated question with ID: ${question._id}`);
      }

      await session.commitTransaction();
      console.log("Migration completed successfully.");
    } catch (error) {
      await session.abortTransaction();
      console.error("Error during migration, transaction aborted:", error);
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    process.exit(0);
  }
};

migrateQuestions();