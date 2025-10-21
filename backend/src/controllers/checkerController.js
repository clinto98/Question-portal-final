import Question from "../models/Question.js";
import QuestionPaper from "../models/QuestionPaper.js";
import mongoose from "mongoose";
import Checker from "../models/Checker.js";
import Maker from "../models/Maker.js";
import { updateTotalAmount } from "../utils/walletHelper.js";

const getPendingQuestions = async (req, res) => {
    try {
        // Find all questions with the status "Pending".
        const questions = await Question.find({ status: "Pending" })
            // --- ADDED SORTING ---
            // Sort by the 'createdAt' field in descending order (-1) to get the newest first.
            // Mongoose automatically adds a `createdAt` timestamp by default with `timestamps: true` in the schema.
            .sort({ createdAt: -1 })

            // Chain multiple .populate() calls to retrieve related data.

            // Populate the 'maker' field with the user's name and email.
            .populate("maker", "name email")

            // Populate the 'course' field with its 'title'.
            .populate("course", "title")

            // Populate the 'questionPaper' field with its 'name'.
            .populate("questionPaper", "name");

        // The response will now contain the full maker, course, and question paper objects, sorted by newest.
        res.json(questions);

    } catch (err) {
        console.error("Error fetching pending questions:", err);
        res.status(500).json({ message: "Server error fetching pending questions" });
    }
};

const updateActionLog = async (Model, userId, logArrayName, questionId, session) => {
    const result = await Model.updateOne(
        { _id: userId, [`${logArrayName}.questionId`]: questionId },
        { $push: { [`${logArrayName}.$.actionDates`]: new Date() } },
        { session }
    );

    if (result.modifiedCount === 0) {
        await Model.findByIdAndUpdate(
            userId,
            { $push: { [logArrayName]: { questionId: questionId, actionDates: [new Date()] } } },
            { session }
        );
    }
};




// Approve a question
const approveQuestion = async (req, res) => {
    const { id } = req.params;
    const currentCheckerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const questionToApprove = await Question.findById(id).session(session);
        if (!questionToApprove) throw new Error("Question not found.");

        const originalCheckerId = questionToApprove.checkedBy;
        const makerId = questionToApprove.maker;
        const questionId = questionToApprove._id;

        // Handle "False Rejection" Logging
        if (questionToApprove.makerComments === "No corrections required" && originalCheckerId) {
            await updateActionLog(Checker, originalCheckerId, 'checkerfalserejections', questionId, session);
            await updateTotalAmount(makerId, 2);
        }

        // Update the Question's status
        const updatedQuestion = await Question.findByIdAndUpdate(id, {
            status: "Approved",
            checkedBy: currentCheckerId,
            checkerComments: "",
        }, { new: true, session });

        // Increment approved question count if status changed to Approved
        if (questionToApprove.status !== 'Approved') {
            await QuestionPaper.findByIdAndUpdate(
                questionToApprove.questionPaper,
                { $inc: { approvedQuestionCount: 1 } },
                { session }
            );
        }

        // Log this approval for the current checker and the maker
        await updateActionLog(Checker, currentCheckerId, 'checkeracceptedquestion', questionId, session);
        await updateActionLog(Maker, makerId, 'makeracceptedquestions', questionId, session);

        const amount = questionToApprove.difficulty === 1 ? 6 : 3;
        await updateTotalAmount(makerId, amount);
        await updateTotalAmount(currentCheckerId, 3);

        await session.commitTransaction();
        res.json(updatedQuestion);

    } catch (err) {
        await session.abortTransaction();
        console.error("Error in approveQuestion transaction:", err);
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during approval. The operation was rolled back." });
    } finally {
        session.endSession();
    }
};


const rejectQuestion = async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    const checkerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!comments || comments.trim() === "") {
            throw new Error("Comments are required for rejection.");
        }

        const questionToReject = await Question.findById(id).session(session);
        if (!questionToReject) {
            throw new Error("Question not found.");
        }

        const question = await Question.findByIdAndUpdate(id, {
            status: "Rejected",
            checkerComments: comments,
            checkedBy: checkerId
        }, { new: true, session });

        // Decrement approved question count if status was Approved
        if (questionToReject.status === 'Approved') {
            await QuestionPaper.findByIdAndUpdate(
                questionToReject.questionPaper,
                { $inc: { approvedQuestionCount: -1 } },
                { session }
            );
        }

        const questionId = question._id;
        const makerId = question.maker;

        // Log this rejection for the current checker
        await updateActionLog(Checker, checkerId, 'checkerrejectedquestion', questionId, session);

        // Log this rejection for the question's maker
        await updateActionLog(Maker, makerId, 'makerrejectedquestions', questionId, session);

        await updateTotalAmount(makerId, -2);
        await updateTotalAmount(checkerId, 3);

        await session.commitTransaction();
        res.json(question);

    } catch (err) {
        await session.abortTransaction();
        console.error("Error in rejectQuestion transaction:", err);

        if (err.message.includes("Comments are required")) {
            return res.status(400).json({ message: err.message });
        }
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Server error during rejection. The operation was rolled back." });
    } finally {
        session.endSession();
    }
};


// Fetch all reviewed questions (Approved + Rejected)
const getReviewedQuestions = async (req, res) => {
    try {
        const questions = await Question.find({
            status: { $in: ["Approved", "Rejected", "Finalised"] },
            checkedBy: req.user._id
        })
            // Populate the maker's details
            .populate("maker", "name email")
            // --- UPDATED: Populate the course title ---
            .populate("course", "title")
            // --- UPDATED: Populate the question paper name ---
            .populate("questionPaper", "name")
            .sort({ updatedAt: -1 }); // Sort by last updated time

        res.json(questions);
    } catch (err) {
        console.error("Error fetching reviewed questions:", err);
        res.status(500).json({ message: "Server error fetching reviewed questions" });
    }
};

const bulkApproveQuestions = async (req, res) => {
    const { ids } = req.body;
    const currentCheckerId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error("An array of question IDs is required.");
        }

        // 2. Find all valid questions to get their makers, original checkers, and comments
        const questionsToApprove = await Question.find(
            { _id: { $in: ids }, status: "Pending" },
            'maker checkedBy makerComments questionPaper' // Projection to get all needed fields
        ).session(session);

        if (questionsToApprove.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "No matching pending questions were found to approve." });
        }

        const approvedQuestionIds = questionsToApprove.map(q => q._id);

        // 3. Update the status of all questions at once
        const result = await Question.updateMany(
            { _id: { $in: approvedQuestionIds } },
            { $set: { status: "Approved", checkedBy: currentCheckerId, checkerComments: "" } },
            { session }
        );

        // 4. Prepare for concurrent log updates
        const updatePromises = [];

        const paperCounts = questionsToApprove.reduce((acc, q) => {
            if (q.questionPaper) {
                const paperId = q.questionPaper.toString();
                acc[paperId] = (acc[paperId] || 0) + 1;
            }
            return acc;
        }, {});

        const bulkUpdatePromises = Object.entries(paperCounts).map(([paperId, count]) =>
            QuestionPaper.findByIdAndUpdate(
                paperId,
                { $inc: { approvedQuestionCount: count } },
                { session }
            )
        );

        updatePromises.push(...bulkUpdatePromises);

        for (const question of questionsToApprove) {
            const makerId = question.maker;
            const questionId = question._id;
            const originalCheckerId = question.checkedBy;

            // Log the approval for the current checker
            updatePromises.push(
                updateActionLog(Checker, currentCheckerId, 'checkeracceptedquestion', questionId, session)
            );

            // Log the approval for the question's maker
            updatePromises.push(
                updateActionLog(Maker, makerId, 'makeracceptedquestions', questionId, session)
            );

            // If it was a "false rejection", log that for the original checker
            if (question.makerComments === "No corrections required" && originalCheckerId) {
                updatePromises.push(
                    updateActionLog(Checker, originalCheckerId, 'checkerfalserejections', questionId, session)
                );
            }
        }

        // 5. Execute all historical log updates concurrently
        await Promise.all(updatePromises);

        // 6. If everything succeeds, commit the transaction
        await session.commitTransaction();

        res.json({ message: `${result.modifiedCount} question(s) have been successfully approved.` });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error during bulk approval transaction:", err);
        if (err.message.includes("IDs is required")) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "A server error occurred. The bulk approval was rolled back." });
    } finally {
        session.endSession();
    }
};

const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the question by its ID.
        // --- UPDATED: Chained additional .populate() calls ---
        const question = await Question.findById(id)
            // Populate the 'maker' who created the question.
            .populate("maker", "name email")

            // Populate the 'checkedBy' user if the question has been reviewed.
            .populate("checkedBy", "name email")

            // Populate the 'course' to get its title.
            .populate("course", "title")

            // Populate the 'questionPaper' and select both its 'name' and 'url'.
            // This is the key change to send the PDF URL to the frontend.
            .populate("questionPaper", "name solutionPaperFile questionPaperFile");

        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        // The question object sent in the response will now include a 'questionPaper'
        // object with the name and url, e.g., 
        // questionPaper: { _id: '...', name: 'Sample Paper 2024', url: 'http://...' }
        return res.json(question);

    } catch (err) {
        console.error("Error fetching question by ID:", err);
        if (err.kind === 'ObjectId') {
            // This handles cases where the provided ID is not a valid MongoDB ObjectId format.
            return res.status(400).json({ message: "Invalid question ID format." });
        }
        return res.status(500).json({ message: "Server error." });
    }
};

const getPapers = async (req, res) => {
    try {
        // Find all documents where 'usedBy' is NOT null.
        // This finds all papers that have been locked by a maker.
        const claimedPapers = await QuestionPaper.find({ usedBy: { $ne: null } })
            .populate("usedBy", "name") // CRITICAL: Get the name of the maker who claimed it.
            .sort({ updatedAt: -1 });  // Show the most recently claimed papers first.
        res.json(claimedPapers);
    } catch (err) {
        console.error("Error fetching claimed papers:", err);
        res.status(500).json({ message: "Server error while fetching claimed papers." });
    }
};

const getCheckerDashboardStats = async (req, res) => {
    try {
        const { timeframe = 'all', startDate: start, endDate: end } = req.query;
        const checkerId = new mongoose.Types.ObjectId(req.user._id);

        const { startDate, endDate } = getDateRange(timeframe, start, end);

        // --- Queries for Stats ---

        // 1. Total questions (Approved + Pending) - Not timeframe dependent
        const totalQuestions = await Question.countDocuments({
            status: { $in: ["Approved", "Pending","Finalised","Rejected","Draft"] }
        });

        // 2. Approved by this checker - Timeframe dependent
        const checkerData = await Checker.aggregate([
            { $match: { _id: checkerId } },
            {
                $project: {
                    approvedCount: {
                        $size: {
                            $filter: {
                                input: "$checkeracceptedquestion",
                                as: "action",
                                cond: {
                                    $anyElementTrue: {
                                        $map: {
                                            input: "$$action.actionDates",
                                            as: "date",
                                            in: {
                                                $and: [
                                                    { $gte: ["$$date", startDate] },
                                                    { $lte: ["$$date", endDate] }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);
        const approvedByChecker = checkerData[0]?.approvedCount || 0;

        // 3. Rejected by this checker - Not timeframe dependent
        const rejectedByChecker = await Question.countDocuments({
            checkedBy: checkerId,
            status: "Rejected"
        });

        // 4. Total pending questions - Not timeframe dependent
        const totalPending = await Question.countDocuments({
            status: "Pending"
        });

        // 5. Total draft questions - Not timeframe dependent
        const totalDrafts = await Question.countDocuments({
            status: "Draft"
        });

        // --- Aggregation for Chart Data (remains the same) ---
        const chartDataAggregation = await Question.aggregate([
            {
                $match: {
                    $or: [
                        { createdAt: { $gte: startDate, $lte: endDate } },
                        { updatedAt: { $gte: startDate, $lte: endDate } }
                    ]
                }
            },
            {
                $facet: {
                    chartData: [
                        {
                            $project: {
                                date: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: { $cond: [{ $eq: ["$status", "Pending"] }, "$createdAt", "$updatedAt"] }
                                    }
                                },
                                status: "$status",
                                createdAt: "$createdAt",
                                updatedAt: "$updatedAt"
                            }
                        },
                        {
                            $match: {
                                $or: [
                                    { status: 'Pending', createdAt: { $gte: startDate, $lte: endDate } },
                                    { status: 'Approved', updatedAt: { $gte: startDate, $lte: endDate } },
                                    { status: 'Rejected', updatedAt: { $gte: startDate, $lte: endDate } },
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: "$date",
                                approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
                                rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $project: { _id: 0, date: "$_id", approved: 1, rejected: 1, pending: 1 } }
                    ]
                }
            }
        ]);

        res.json({
            stats: {
                totalQuestions: totalQuestions,
                totalApproved: approvedByChecker,
                totalRejected: rejectedByChecker,
                totalPending: totalPending,
                totalDrafts: totalDrafts
            },
            chartData: chartDataAggregation[0].chartData,
        });

    } catch (err) {
        console.error("Error in getCheckerDashboardStats:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// You should also have this helper function available in the file or imported
const getDateRange = (timeframe, start, end) => {
    const now = new Date();
    let startDate = new Date(0); // Default to the beginning of time for 'all'
    let endDate = now;

    if (timeframe === 'weekly') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'monthly') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'custom' && start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
    }
    return { startDate, endDate };
};

export {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions,
    getQuestionById,
    getPapers,
    getCheckerDashboardStats
};