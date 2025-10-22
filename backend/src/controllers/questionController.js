import Question from "../models/Question.js";
import { QUESTION_STATUS, MAKER_PAPER_CLAIM_LIMIT } from "../constants/roles.js";
import cloudinary from "../config/cloudinary.js"; 
import QuestionPaper from "../models/QuestionPaper.js";
import Course from "../models/Course.js"
import mongoose from 'mongoose';
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";

const updateActionLog = async (Model, userId, logArrayName, questionId, session) => {
    const user = await Model.findById(userId).session(session);
    if (!user) {
        // This case should be rare, but it's a good safeguard.
        console.warn(`User not found for model ${Model.modelName} with ID ${userId}`);
        return;
    }

    // Find the specific log entry for the given question within the user's document.
    const logEntry = user[logArrayName].find(log => log.questionId.equals(questionId));

    if (logEntry) {
        // If the log already exists, simply push a new timestamp to its actionDates array.
        logEntry.actionDates.push(new Date());
    } else {
        // If it's the first time this action is logged for this question, create a new entry.
        user[logArrayName].push({
            questionId: questionId,
            actionDates: [new Date()]
        });
    }

    // Save the entire updated user document. Mongoose will validate the change.
    await user.save({ session });
};


const createOrUpdateQuestion = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let {
            _id, course, unit, subject, chapter, questionText,
            questionPaper, questionNumber, correctAnswer, explanation,
            complexity, keywords, status, makerComments, makerCommentIndex,
            existingQuestionImage, existingExplanationImage,
            existingReferenceImage1, existingReferenceImage2,
            existingChoiceImages, questionPaperYear, choicesText, hasImage
        } = req.body;
        if (Array.isArray(_id)) {
            console.warn(_id);
            _id = _id[0];
        }

        // --- Find Course ID ---
        let courseId;
        if (mongoose.Types.ObjectId.isValid(course)) {
            courseId = course;
        } else {
            const courseDoc = await Course.findOne({ title: course }).session(session);
            if (!courseDoc) throw new Error(`Invalid course provided: "${course}" not found.`);
            courseId = courseDoc._id;
        }

        // --- Cloudinary Upload Helper ---
        const uploadToCloudinary = async (file) => {
            if (!file) return null;
            const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
            const result = await cloudinary.uploader.upload(base64, { folder: "questions" });
            return result.secure_url;
        };

        // --- Image and Choices Processing ---
        const questionImage = req.files?.questionImage ? await uploadToCloudinary(req.files.questionImage[0]) : (existingQuestionImage || null);
        const explanationImage = req.files?.explanationImage ? await uploadToCloudinary(req.files.explanationImage[0]) : (existingExplanationImage || null);
        const referenceImageUrl1 = req.files?.referenceImage1 ? await uploadToCloudinary(req.files.referenceImage1[0]) : (existingReferenceImage1 || null);
        const referenceImageUrl2 = req.files?.referenceImage2 ? await uploadToCloudinary(req.files.referenceImage2[0]) : (existingReferenceImage2 || null);

        let choiceTextsArr = choicesText || [];
        if (!Array.isArray(choiceTextsArr)) choiceTextsArr = [choiceTextsArr];
        const hasImageFlags = hasImage || [];
        const choiceFiles = req.files?.choicesImage || [];
        let existingImages = existingChoiceImages || [];
        if (existingImages && !Array.isArray(existingImages)) existingImages = [existingImages];
        const newImageUrls = await Promise.all((choiceFiles || []).map(file => uploadToCloudinary(file)));

        let fileCounter = 0;
        const finalImageUrls = hasImageFlags.map((hasImg, i) => {
            if (hasImg !== 'true') return null;
            return existingImages[i] || newImageUrls[fileCounter++];
        });

        const mappedChoices = choiceTextsArr.map((text, i) => ({
            text: text || "",
            image: finalImageUrls[i],
            isCorrect: Number(correctAnswer) === i,
        }));

        // --- NEW: Calculate difficulty based on total image count ---
        let totalImageCount = 0;
        if (questionImage) totalImageCount++;
        if (explanationImage) totalImageCount++;
        if (referenceImageUrl1) totalImageCount++;
        if (referenceImageUrl2) totalImageCount++;

        // Count non-null image URLs in the choices array
        totalImageCount += finalImageUrls.filter(url => url).length;

        // Set difficulty: 1 if more than 5 images, otherwise 0
        const difficulty = totalImageCount > 5 ? 1 : 0;
        // --- END OF NEW LOGIC ---

        // --- Construct Question Data Object ---
        const questionData = {
            course: courseId, unit, subject, chapter, questionPaperYear, questionPaper, questionNumber,
            question: { text: questionText || "", image: questionImage },
            options: mappedChoices,
            explanation: { text: explanation || "", image: explanationImage },
            reference: { image1: referenceImageUrl1, image2: referenceImageUrl2 },
            complexity,
            difficulty, // Newly calculated difficulty field
            keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
            status: status || 'Draft',
            makerComments: makerComments || "",
        };

        let question;
        const makerId = req.user._id;

        if (_id) { // This is an UPDATE or RESUBMISSION
            const originalQuestion = await Question.findById(_id).session(session);
            if (!originalQuestion) throw new Error("Question not found for update.");

            const originalCheckerId = originalQuestion.checkedBy;

            // Condition: A previously rejected question is resubmitted with "No corrections required"
            if (originalQuestion.status === 'Rejected' && Number(makerCommentIndex) === 1) {
                // Decrement the rejection log by removing the last timestamp from the array.
                await Maker.updateOne(
                    { _id: makerId, "makerrejectedquestions.questionId": _id },
                    { $pop: { "makerrejectedquestions.$.actionDates": 1 } }, // 1 pops the last element
                    { session }
                );

                // Clean up the entry if the dates array becomes empty.
                await Maker.updateOne(
                    { _id: makerId },
                    { $pull: { makerrejectedquestions: { actionDates: { $size: 0 } } } },
                    { session }
                );
            }

            // Condition: A draft is being submitted for the first time
            if (originalQuestion.status === 'Draft' && status === 'Pending') {
                await Maker.findByIdAndUpdate(
                    makerId,
                    { $pull: { makerdraftedquestions: { questionId: _id } } },
                    { session }
                );
            }

            question = await Question.findByIdAndUpdate(_id, questionData, { new: true, session });

        } else { // This is a NEW question
            questionData.maker = makerId;
            question = new Question(questionData);
            await question.save({ session });

            if (question.status === 'Draft') {
                await updateActionLog(Maker, makerId, 'makerdraftedquestions', question._id, session);
            }
        }

        await session.commitTransaction();
        const message = _id ? "Question updated successfully" : "Question created successfully";
        res.status(_id ? 200 : 201).json({ message, question });

    } catch (err) {
        await session.abortTransaction();
        console.error("Error in createOrUpdateQuestion:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    } finally {
        session.endSession();
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('course', 'title') // Populates 'course' and selects only the 'title' field
            .populate('questionPaper', 'name'); // Populates 'questionPaper' and selects the 'name'

        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.json(question);
    } catch (err) {
        console.error("Error fetching question by ID:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


const getDraftQuestions = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all questions with "Draft" status created by the current user.
        // We send the full question object to the frontend.
        const drafts = await Question.find({
            maker: userId,
            status: "Draft",
        })
        .populate("course", "title") // Populate the course title
        .sort({ updatedAt: -1 }); // Sort by most recently updated

        // No mapping needed; the full object contains all necessary data.
        res.json(drafts);

    } catch (error) {
        console.error("Error fetching draft questions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteQuestions = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user._id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No question IDs provided." });
        }

        // 1. Find all questions that the user owns and intends to delete.
        const questionsToDelete = await Question.find({
            _id: { $in: ids },
            maker: userId,
        });

        if (questionsToDelete.length === 0) {
            return res.json({ message: "No matching questions found to delete." });
        }

        // 2. Collect all Cloudinary public IDs from all image fields.
        const publicIdsToDelete = [];

        // Helper function to safely extract the public ID from a Cloudinary URL
        const getPublicIdFromUrl = (url) => {
            if (!url) return null;
            // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
            // We want to extract "folder/public_id"
            const match = url.match(/v\d+\/(.+)\.\w{3,4}$/);
            return match ? match[1] : null;
        };

        for (const q of questionsToDelete) {
            // Add main images
            if (q.question?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.question.image));
            if (q.explanation?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.explanation.image));
            if (q.reference?.image) publicIdsToDelete.push(getPublicIdFromUrl(q.reference.image));

            // Add all choice images
            if (q.options) {
                for (const opt of q.options) {
                    if (opt.image) publicIdsToDelete.push(getPublicIdFromUrl(opt.image));
                }
            }
        }

        // 3. If there are images, delete them from Cloudinary.
        // We filter out any null values that may have resulted from empty image fields.
        const validPublicIds = publicIdsToDelete.filter(id => id);

        if (validPublicIds.length > 0) {
            try {
                // Use Cloudinary's bulk deletion API for efficiency
                await cloudinary.api.delete_resources(validPublicIds);
            } catch (cloudinaryError) {
                // Log the Cloudinary error but proceed with database deletion.
                // This prevents a Cloudinary issue from blocking the user's primary action.
                console.error("Cloudinary deletion failed for some assets, but proceeding with DB deletion:", cloudinaryError);
            }
        }

        // 4. Finally, delete the questions from the database.
        const result = await Question.deleteMany({
            _id: { $in: ids },
            maker: userId,
        });

        return res.json({
            message: `${result.deletedCount} question(s) deleted successfully.`,
        });

    } catch (error) {
        console.error("Error deleting questions:", error);
        res.status(500).json({ message: "Server error while deleting questions." });
    }
};

const submitQuestionsForApproval = async (req, res) => {
    try {
        const { ids } = req.body;
        const userId = req.user._id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No question IDs provided" });
        }

        const result = await Question.updateMany(
            { _id: { $in: ids }, maker: userId }, // only maker's drafts
            { $set: { status: "Pending" } }
        );

        return res.json({
            message: `${result.modifiedCount} question(s) submitted for approval successfully`,
        });
    } catch (error) {
        console.error("Error submitting questions for approval:", error);
        res.status(500).json({ message: "Server error while submitting questions" });
    }
};

// Get all submitted questions for a maker
const getSubmittedQuestions = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch questions created by the user that are NOT in 'Draft' status.
        const questions = await Question.find({
            maker: userId,
            status: { $ne: "Draft" }
        })
            // --- UPDATED ---
            // Chain .populate() to retrieve data from referenced documents.

            // For the 'course' field, get the referenced document and select only its 'title'.
            .populate("course", "title")

            // For the 'questionPaper' field, get the referenced document and select only its 'name'.
            .populate("questionPaper", "name")

            .sort({ createdAt: -1 });

        // The response for each question will now include objects for 'course' and 'questionPaper'
        // For example: course: { _id: '...', title: '10th_CBSE' }
        res.json(questions);

    } catch (error) {
        console.error("Error fetching submitted questions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAvailablePapers = async (req, res) => {
    try {
        // Find all question papers where the 'claimedBy' field is not set (i.e., is null or does not exist).
        // This retrieves all "unlocked" or "available" papers.
        const availablePapers = await QuestionPaper.find({ usedBy: null })
            // Populate the 'course' field and select only its 'title' for the response.
            .populate({
                path: 'course',
                select: 'title'
            })
            // Continue to populate the name of the admin who uploaded it.
            .populate({
                path: 'uploadedBy',
                select: 'name'
            })
            // Sort to show the most recently uploaded papers first.
            .sort({ createdAt: -1 });

        res.status(200).json(availablePapers);

    } catch (err) {
        console.error("Error fetching available papers:", err);
        res.status(500).json({ message: "Server error while fetching available papers." });
    }
};

const claimPaper = async (req, res) => {
    try {
        const paperId = req.params.id;
        const makerId = req.user._id; // The logged-in maker's ID (from the 'protect' middleware)

        // Check maker's claim limit
        const claimedPapers = await QuestionPaper.find({ usedBy: makerId });
        let unfinishedPapersCount = 0;

        for (const paper of claimedPapers) {
            const createdQuestionsCount = await Question.countDocuments({ maker: makerId, questionPaper: paper._id });
            if (createdQuestionsCount < paper.numberOfQuestions) {
                unfinishedPapersCount++;
            }
        }

        if (unfinishedPapersCount >= MAKER_PAPER_CLAIM_LIMIT) {
            return res.status(403).json({ message: `You have reached the maximum limit of ${MAKER_PAPER_CLAIM_LIMIT} claimed papers. Please complete your pending papers before claiming new ones.` });
        }

        // This is a critical atomic operation. It finds a document that matches BOTH conditions:
        // 1. The _id matches the one the user clicked.
        // 2. The 'usedBy' field is STILL null.
        // If it finds a match, it updates 'usedBy' to the current maker's ID.
        const updatedPaper = await QuestionPaper.findOneAndUpdate(
            { _id: paperId, usedBy: null },
            { $set: { usedBy: makerId } },
            { new: true } // This option tells Mongoose to return the document AFTER the update
        );

        // If 'updatedPaper' is null, it means the paper was not found OR another maker
        // claimed it in the moments after the page was loaded. This prevents a race condition.
        if (!updatedPaper) {
            return res.status(409).json({ // 409 Conflict is the appropriate status code
                message: "This paper is no longer available. It may have been taken by another user. Please refresh and select a different one."
            });
        }

        res.json({
            success: true,
            message: "Paper successfully assigned to you.",
            paper: updatedPaper
        });

    } catch (err) {
        console.error("Error claiming paper:", err);
        res.status(500).json({ message: "Server error while claiming the paper." });
    }
};

const getClaimedPapers = async (req, res) => {
    try {
        const makerId = req.user._id; // Get the maker's ID from the auth middleware

        // Find all documents in the QuestionPaper collection where the 'usedBy' field
        // matches the currently logged-in maker's ID.
        const claimedPapers = await QuestionPaper.find({ usedBy: makerId })
            .populate("uploadedBy", "name") // Optional: gets the name of the admin who uploaded it
            .populate("course", "title") // Also populate the course title
            .sort({ updatedAt: -1 });      // Shows the most recently claimed/updated papers first

        res.json(claimedPapers);

    } catch (err) {
        console.error("Error fetching claimed papers:", err);
        res.status(500).json({ message: "Server error while fetching claimed papers." });
    }
};

const getAllCourses = async (req, res) => {
    try {
        // Find all courses with an "Active" status to populate the dropdown.
        // .sort({ title: 1 }) sorts them alphabetically by title.
        // .select('title') ensures you only fetch the title field for efficiency.
        const courses = await Course.find({ status: "Active" })
            .sort({ title: 1 })
            .select("title");

        // Send the list of courses back as a JSON response.
        res.status(200).json(courses);

    } catch (error) {
        // Log the error for debugging purposes.
        console.error("Error fetching courses:", error);

        // Send a generic server error response to the client.
        res.status(500).json({ message: "Server error, could not fetch courses." });
    }
};

const getClaimedPapersByMaker = async (req, res) => {
    try {
        // req.user._id is populated by your authentication middleware
        const makerId = req.user._id;

        if (!makerId) {
            return res.status(401).json({ message: "Not authorized, no user ID found." });
        }

        // Find all question papers where the 'usedBy' field matches the maker's ID
        const claimedPapers = await QuestionPaper.find({ usedBy: makerId })
            // --- ADDED SORTING ---
            // Sort by the 'createdAt' field in descending order (-1) to get the newest first.
            // This assumes your QuestionPaper schema has timestamps enabled (`{ timestamps: true }`).
            .sort({ createdAt: -1 });

        // Note: .find() returns an empty array ([]) if no documents are found,
        // so a 404 check here is not typically necessary. The client will receive an empty array.

        res.status(200).json(claimedPapers);
    } catch (err) {
        console.error("Error fetching claimed question papers:", err);
        res.status(500).json({ message: "Server error while fetching papers", error: err.message });
    }
};

const getQuestionPaperById = async (req, res) => {
    try {
        const paper = await QuestionPaper.findById(req.params.id)
            .populate({ path: 'course', select: 'title' });

        if (!paper) {
            return res.status(404).json({ message: "Question Paper not found." });
        }
        res.status(200).json(paper);
    } catch (error) {
        console.error("Error in getQuestionPaperById:", error);
        res.status(500).json({ message: "Server error fetching paper details." });
    }
};

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
        // Ensure the end date covers the entire day
        endDate.setHours(23, 59, 59, 999);
    }
    return { startDate, endDate };
};

const getMakerDashboardStats = async (req, res) => {
    try {
        const makerId = req.user._id;
        const { timeframe = 'all', startDate: start, endDate: end } = req.query;

        const { startDate, endDate } = getDateRange(timeframe, start, end);

        // Fetch all necessary data concurrently for efficiency
        const [
            maker,
            allCreatedQuestions,
            totalPending,
            currentlyRejected,
            totalResubmitted,
            totalDrafted // --- CHANGED: Get this count directly from Questions
        ] = await Promise.all([
            Maker.findById(makerId).lean(),
            Question.find({ maker: makerId, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
            // These are current snapshot counts, not time-based
            Question.countDocuments({ maker: makerId, status: 'Pending' }),
            Question.countDocuments({ maker: makerId, status: 'Rejected' }),
            Question.countDocuments({
                maker: makerId,
                status: 'Pending',
                makerComments: { $exists: true, $ne: "" },
                updatedAt: { $gte: startDate, $lte: endDate }
            }),
            // --- ADDED: The new, accurate query for current drafts ---
            Question.countDocuments({ maker: makerId, status: 'Draft' })
        ]);

        if (!maker) {
            return res.status(404).json({ message: "Maker not found." });
        }

        // Calculate statistics based on the new schema with actionDates
        let totalAcceptedInTimeframe = 0;
        (maker.makeracceptedquestions || []).forEach(log => {
            const count = (log.actionDates || []).filter(date => new Date(date) >= startDate && new Date(date) <= endDate).length;
            totalAcceptedInTimeframe += count;
        });

        const historicalRejections = (maker.makerrejectedquestions || []).reduce((sum, log) => {
            const countInTimeframe = (log.actionDates || []).filter(date => new Date(date) >= startDate && new Date(date) <= endDate).length;
            return sum + countInTimeframe;
        }, 0);

        // --- REMOVED: The old, incorrect calculation ---
        // const totalDrafted = (maker.makerdraftedquestions || []).length;

        const totalCreated = allCreatedQuestions.length;

        // Prepare data for the chart using the new actionDates
        const chartData = {};

        const processForChart = (date, type) => {
            const dateString = new Date(date).toISOString().split('T')[0];
            if (!chartData[dateString]) {
                chartData[dateString] = { date: dateString, created: 0, approved: 0, rejected: 0 };
            }
            chartData[dateString][type]++;
        };

        allCreatedQuestions.forEach(q => processForChart(q.createdAt, 'created'));

        (maker.makeracceptedquestions || []).forEach(log => {
            (log.actionDates || []).forEach(date => {
                if (new Date(date) >= startDate && new Date(date) <= endDate) {
                    processForChart(date, 'approved');
                }
            });
        });

        (maker.makerrejectedquestions || []).forEach(log => {
            (log.actionDates || []).forEach(date => {
                if (new Date(date) >= startDate && new Date(date) <= endDate) {
                    processForChart(date, 'rejected');
                }
            });
        });

        const sortedChartData = Object.values(chartData).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            stats: {
                totalCreated,
                totalAccepted: totalAcceptedInTimeframe,
                historicalRejections: historicalRejections,
                currentlyRejected,
                totalDrafted, // This now holds the correct, real-time count
                totalResubmitted,
                totalPending,
            },
            chartData: sortedChartData,
        });

    } catch (err) {
        console.error("Error in getMakerDashboardStats:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


export { createOrUpdateQuestion, 
    getQuestionById, 
    getDraftQuestions, deleteQuestions, 
    submitQuestionsForApproval, getSubmittedQuestions , 
    getAvailablePapers,claimPaper,
    getClaimedPapers,getAllCourses,
    getClaimedPapersByMaker,getQuestionPaperById,getMakerDashboardStats};

