import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";
import PreviousQuestionPaper from "../models/PreviousQuestionPaper.js";
import { QUESTION_STATUS } from "../constants/roles.js";
import uploadToCloudinary from "../utils/cloudanaryhelper.js";

// @desc    Get all questions approved by checker
// @route   GET /api/expert/questions
// @access  Private/Expert
const getApprovedQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ status: QUESTION_STATUS.APPROVED })
            .populate("course", "title")
            .populate("maker", "name");

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        console.error("Error fetching approved questions:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get all finalized questions
// @route   GET /api/expert/questions/finalized
// @access  Private/Expert
const getFinalizedQuestions = async (req, res) => {
    try {
        const previousPapers = await PreviousQuestionPaper.find({}).populate('course', 'title').sort({ createdAt: -1 });

        const finalizedQuestions = previousPapers.flatMap(paper =>
            paper.questions.map(q => ({
                _id: q._id, // This is the sub-document ID
                question: { text: q.question, image: q.diagramUrl },
                course: paper.course, // Populated course
                subject: paper.subject,
                status: QUESTION_STATUS.FINALISED,
                maker: { name: "N/A" }, // Maker info is not available in PreviousQuestionPaper
                createdAt: paper.createdAt, // For sorting
            }))
        );

        res.status(200).json({ success: true, data: finalizedQuestions });
    } catch (error) {
        console.error("Error fetching finalized questions:", error);
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
            unit: finalizedQuestion.unitNo,
            chapter: finalizedQuestion.topic,
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
    try {
        const { id } = req.params;
        const {
            questionText, choicesText, correctAnswer, existingQuestionImage, 
            existingChoiceImages, hasImage, complexity, FrequentlyAsked, 
            unit, unitNo, topic, keywords, explanation, existingExplanationImage
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
            difficulty: complexity?.toLowerCase() || 'easy',
            explanation: explanation || "",
            explanationImageUrl: explanationImage || null,
            keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
            unitNo: unitNo,
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
            unit: unit,
            course: question.course._id,
        });

        await newPreviousPaper.save();

        // --- Update original question status ---
        question.finalisedBy = req.user._id;
        question.status = QUESTION_STATUS.FINALISED;
        await question.save();

        res.status(200).json({ 
            success: true, 
            message: "Question finalized and moved to previous papers successfully.",
            data: newPreviousPaper
        });

    } catch (error) {
        console.error("Error finalizing question:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export { getApprovedQuestions, getFinalizedQuestions, getQuestionById, getFinalizedQuestionById, approveQuestion };