import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";
import PreviousQuestionPaper from "../models/PreviousQuestionPaper.js";
import { QUESTION_STATUS } from "../constants/roles.js";
import uploadToCloudinary from "../utils/cloudanaryhelper.js";
import axios from "axios";
import mongoose from "mongoose";
import Course from "../models/Course.js";

// @desc    Get all questions approved by checker
// @route   GET /api/expert/questions
// @access  Private/Expert
const getApprovedQuestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const course = req.query.course;
        const subject = req.query.subject;

        let query = { status: QUESTION_STATUS.APPROVED };

        if (course && course !== "All") {
            // We need to find the course ID first based on the title
            const courseDoc = await mongoose.model('Course').findOne({ title: course });
            if (courseDoc) {
                query.course = courseDoc._id;
            }
        }

        if (subject && subject !== "All") {
            query.subject = subject;
        }

        const totalQuestions = await Question.countDocuments(query);
        const totalPages = Math.ceil(totalQuestions / limit);

        const questions = await Question.find(query)
            .populate("course", "title")
            .populate("maker", "name")
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: questions,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.error("Error fetching approved questions:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all unique courses for approved questions
// @route   GET /api/expert/courses
// @access  Private/Expert
const getApprovedQuestionCourses = async (req, res) => {
    try {
        const courseIds = await Question.distinct("course", { status: QUESTION_STATUS.APPROVED });
        const courses = await Course.find({ _id: { $in: courseIds } }).select("title");
        const courseTitles = courses.map(course => course.title);
        res.status(200).json({ success: true, data: courseTitles });
    } catch (error) {
        console.error("Error fetching approved question courses:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all unique subjects for approved questions
// @route   GET /api/expert/subjects
// @access  Private/Expert
const getApprovedQuestionSubjects = async (req, res) => {
    try {
        const subjects = await Question.distinct("subject", { status: QUESTION_STATUS.APPROVED });
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        console.error("Error fetching approved question subjects:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all finalized questions
// @route   GET /api/expert/questions/finalized
// @access  Private/Expert
const getFinalizedQuestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const courseTitle = req.query.course;
        const subject = req.query.subject;

        let matchStage = {};
        if (subject && subject !== "All") {
            matchStage.subject = subject;
        }

        let courseMatchStage = {};
        if (courseTitle && courseTitle !== "All") {
            courseMatchStage['course.title'] = courseTitle;
        }

        const aggregation = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'course',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            { $match: courseMatchStage },
            { $unwind: '$questions' },
            {
                $project: {
                    _id: '$questions._id',
                    question: { text: '$questions.question', image: '$questions.diagramUrl' },
                    course: { _id: '$course._id', title: '$course.title' },
                    subject: '$subject',
                    status: 'Finalised',
                    unit: '$questions.unit',
                    unit_no: '$questions.unit_no',
                    topic: '$questions.topic',
                    maker: { name: "N/A" },
                    createdAt: '$createdAt',
                }
            },
            { $sort: { createdAt: -1 } }
        ];

        const countPipeline = [...aggregation, { $count: 'total' }];
        const totalResult = await PreviousQuestionPaper.aggregate(countPipeline);
        const totalQuestions = totalResult.length > 0 ? totalResult[0].total : 0;
        const totalPages = Math.ceil(totalQuestions / limit);

        const dataPipeline = [...aggregation, { $skip: (page - 1) * limit }, { $limit: limit }];
        const finalizedQuestions = await PreviousQuestionPaper.aggregate(dataPipeline);

        res.status(200).json({
            success: true,
            data: finalizedQuestions,
            totalPages,
            currentPage: page,
        });

    } catch (error) {
        console.error("Error fetching finalized questions:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all unique courses for finalized questions
// @route   GET /api/expert/finalized-courses
// @access  Private/Expert
const getFinalizedQuestionCourses = async (req, res) => {
    try {
        const courseIds = await PreviousQuestionPaper.distinct("course");
        const courses = await Course.find({ _id: { $in: courseIds } }).select("title");
        const courseTitles = courses.map(course => course.title);
        res.status(200).json({ success: true, data: courseTitles });
    } catch (error) {
        console.error("Error fetching finalized question courses:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all unique subjects for finalized questions
// @route   GET /api/expert/finalized-subjects
// @access  Private/Expert
const getFinalizedQuestionSubjects = async (req, res) => {
    try {
        const subjects = await PreviousQuestionPaper.distinct("subject");
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        console.error("Error fetching finalized question subjects:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get a single question by ID from the main Questions collection
// @route   GET /api/expert/questions/:id
// @access  Private/Expert
const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate({
                path: 'questionPaper',
                populate: {
                    path: 'course',
                    select: 'title'
                }
            });

        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        res.status(200).json({ success: true, data: question });
    } catch (error) {
        console.error("Error fetching question by ID:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get a single finalized question by its sub-document ID
// @route   GET /api/expert/finalized-questions/:id
// @access  Private/Expert
const getFinalizedQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const paper = await PreviousQuestionPaper.findOne({ "questions._id": id }).populate('course', 'title');

        if (!paper) {
            return res.status(404).json({ success: false, message: "Finalized question not found" });
        }

        const finalizedQuestion = paper.questions.find(q => q._id.toString() === id);

        if (!finalizedQuestion) {
            return res.status(404).json({ success: false, message: "Finalized question not found in paper" });
        }

        const correctAnswer = finalizedQuestion.correctAnswer;
        const options = finalizedQuestion.options.map(o => ({
            text: o.text,
            image: o.diagramUrl,
            isCorrect: o.text === correctAnswer.text && o.diagramUrl === correctAnswer.diagramUrl,
        }));

        const responseData = {
            question: {
                text: finalizedQuestion.question,
                image: finalizedQuestion.diagramUrl,
            },
            options: options,
            explanation: {
                text: finalizedQuestion.explanation,
                image: finalizedQuestion.explanationImageUrl,
            },
            subject: paper.subject,
            complexity: finalizedQuestion.difficulty,
            keywords: finalizedQuestion.keywords,
            questionPaper: {
                name: paper.paperName,
                course: paper.course,
            },
            unit: finalizedQuestion.unit,
            unit_no: finalizedQuestion.unit_no,
            topic: finalizedQuestion.topic,
        };

        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error("Error fetching finalized question by ID:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


// @desc    Approve a question and create a PreviousQuestionPaper
// @route   POST /api/expert/questions/:id/approve
// @access  Private/Expert
const approveQuestion = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const {
            questionText, choicesText, correctAnswer, existingQuestionImage, 
            existingChoiceImages, hasImage, complexity, FrequentlyAsked, 
            unit, unit_no, topic, keywords, explanation, existingExplanationImage
        } = req.body;

        const question = await Question.findById(id).populate("questionPaper").populate("course");

        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }
        if (question.status !== QUESTION_STATUS.APPROVED) {
            return res.status(400).json({ success: false, message: `Question is not in the approved state. Current status: ${question.status}` });
        }

        // --- Image and Choices Processing ---
        const questionImage = req.files?.questionImage ? await uploadToCloudinary(req.files.questionImage[0].buffer) : (existingQuestionImage || null);
        const explanationImage = req.files?.explanationImage ? await uploadToCloudinary(req.files.explanationImage[0].buffer) : (existingExplanationImage || null);

        let choiceTextsArr = choicesText || [];
        if (!Array.isArray(choiceTextsArr)) choiceTextsArr = [choiceTextsArr];
        const hasImageFlags = hasImage || [];
        const choiceFiles = req.files?.choicesImage || [];
        let existingImages = existingChoiceImages || [];
        if (existingImages && !Array.isArray(existingImages)) existingImages = [existingImages];
        const newImageUrls = await Promise.all((choiceFiles || []).map(file => uploadToCloudinary(file.buffer)));

        let fileCounter = 0;
        const finalImageUrls = hasImageFlags.map((hasImg, i) => {
            if (hasImg !== 'true') return null;
            return existingImages[i] || newImageUrls[fileCounter++];
        });

        const mappedChoices = choiceTextsArr.map((text, i) => ({
            text: text || "",
            diagramUrl: finalImageUrls[i],
        }));

        // --- Construct the new question for the previous paper ---
        const newQuestionPayload = {
            question: questionText,
            options: mappedChoices,
            correctAnswer: mappedChoices[correctAnswer] || null,
            diagramUrl: questionImage,
            referenceUrl: null,
            FrequentlyAsked: FrequentlyAsked === 'true',
            difficulty: complexity|| 'Easy',
            explanation: explanation || "",
            explanationImageUrl: explanationImage || null,
            keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
            unit: unit,
            unit_no: unit_no,
            topic: topic,
        };

        // --- Create the new PreviousQuestionPaper ---
        const sourcePaper = question.questionPaper;
        const newPreviousPaper = new PreviousQuestionPaper({
            examYear: sourcePaper.questionPaperYear,
            examType: sourcePaper.examType,
            subject: sourcePaper.subject,
            syllabus: sourcePaper.syllabus,
            standard: sourcePaper.standard,
            paperName: sourcePaper.name,
            sourceType: 'PDF',
            questions: [newQuestionPayload],
            notes: null, // Using explanation as notes
            course: question.course._id,
        });

        await newPreviousPaper.save({ session });

        // --- Update original question status ---
        question.finalisedBy = req.user._id;
        question.status = QUESTION_STATUS.FINALISED;
        await question.save({ session });

        // --- External API Call ---
        try {
            const externalApiBody = {
                ...newPreviousPaper.toObject(),
            };

            await axios.post('https://api.openmcq.com/api/questionpaper/Questionsreceive', externalApiBody, {
                headers: {
                    'X-API-KEY': process.env.OPENMCQ_API_KEY,
                },
            });
        } catch (apiError) {
            console.error("Failed to send data to external API:", apiError.message);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Failed to send data to external API. Please try again." });
        }

        await session.commitTransaction();

        res.status(200).json({ 
            success: true, 
            message: "Question finalized and moved to previous papers successfully.",
            data: newPreviousPaper
        });

    } catch (error) {
        console.error("Error finalizing question:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        session.endSession();
    }
};

export { getApprovedQuestions, getFinalizedQuestions, getQuestionById, getFinalizedQuestionById, approveQuestion, getApprovedQuestionCourses, getApprovedQuestionSubjects, getFinalizedQuestionCourses, getFinalizedQuestionSubjects };