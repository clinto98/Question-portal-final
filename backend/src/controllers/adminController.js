import bcrypt from "bcryptjs";
import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import Expert from "../models/Expert.js";
import cloudinary from "../config/cloudinary.js";
import QuestionPaper from "../models/QuestionPaper.js";
import Question from "../models/Question.js";
import Course from '../models/Course.js'; 
import mongoose from "mongoose";

// Admin creates a new Maker, Checker or Expert
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check role
        if (!["maker", "checker", "expert"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker', 'checker', or 'expert'" });
        }

        let Model;
        switch (role) {
            case "maker":
                Model = Maker;
                break;
            case "checker":
                Model = Checker;
                break;
            case "expert":
                Model = Expert;
                break;
        }

        const existingUser = await Model.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists in the selected role" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await Model.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role,
            },
        });
    } catch (err) {
        console.error("Admin createUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

//  Get all users
const getAllUsers = async (req, res) => {
    try {
        const makers = await Maker.find().select("-password");
        const checkers = await Checker.find().select("-password");

        return res.json({ makers, checkers });
    } catch (err) {
        console.error("Admin getAllUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

//  toggle User Status
const toggleUserStatus = async (req, res) => {
    try {
        const { role, id } = req.params;

        if (!["maker", "checker"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'maker' or 'checker'" });
        }

        const Model = role === "maker" ? Maker : Checker;
        const user = await Model.findById(id);

        if (!user) return res.status(404).json({ message: "User not found" });

        user.isActive = !user.isActive;
        await user.save();

        const status = user.isActive ? "activated" : "deactivated";

        return res.json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} ${status} successfully` });
    } catch (err) {
        console.error("Admin toggleUserStatus error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const uploadPdfToCloudinary = (fileBuffer, courseTitle, subject, fileType) => {
    return new Promise((resolve, reject) => {
        // Sanitize inputs to create a valid folder path (e.g., "Computer Science" -> "Computer_Science")
        const sanitizedCourse = courseTitle.replace(/\s+/g, '_');
        const sanitizedSubject = subject.replace(/\s+/g, '_');

        // Dynamically create the folder path, e.g., "question_papers/10th_CBSE_Science/question_paper"
        const folderPath = `question_papers/${sanitizedCourse}_${sanitizedSubject}/${fileType}`;

        cloudinary.uploader.upload_stream(
            {
                resource_type: "image", // Correct type for PDFs
                folder: folderPath,   // Use the dynamic folder path
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        ).end(fileBuffer);
    });
};

const uploadPdfs = async (req, res) => {
    try {
        // 1. Destructure all metadata fields, including the new 'questionPaperYear'
        const {
            name,
            course,
            subject,
            standard,
            syllabus,
            examType,
            questionPaperYear, // ADDED
            numberOfQuestions
        } = req.body;
        console.log(req.user._id)
        const questionPaperFile = req.files?.questionPaper?.[0];
        const solutionPaperFile = req.files?.solutionPaper?.[0];

        if (!questionPaperFile) {
            return res.status(400).json({ message: "The Question Paper PDF is required." });
        }

        const courseDoc = await Course.findById(course).select("title");
        if (!courseDoc) {
            return res.status(404).json({ message: "Selected course not found." });
        }
        const courseTitle = courseDoc.title;

        const uploadPromises = [uploadPdfToCloudinary(questionPaperFile.buffer, courseTitle, subject, 'question_paper')];
        if (solutionPaperFile) {
            uploadPromises.push(uploadPdfToCloudinary(solutionPaperFile.buffer, courseTitle, subject, 'solution_paper'));
        }

        const [questionPaperResult, solutionPaperResult] = await Promise.all(uploadPromises);
        console.log(questionPaperResult.secure_url)
        // 2. Create the new document data object, including the new field
        const newQuestionPaperData = {
            name,
            course,
            subject,
            standard,
            syllabus,
            examType,
            questionPaperYear, // ADDED
            uploadedBy: req.user._id,
            questionPaperFile: {
                url: questionPaperResult.secure_url,
                publicId: questionPaperResult.public_id,
            },
        };

        if (solutionPaperResult) {
            newQuestionPaperData.solutionPaperFile = {
                url: solutionPaperResult.secure_url,
                publicId: solutionPaperResult.public_id,
            };
        }
        if (numberOfQuestions) {
            newQuestionPaperData.numberOfQuestions = numberOfQuestions;
        }

        const newQuestionPaper = new QuestionPaper(newQuestionPaperData);
        await newQuestionPaper.save();

        res.status(201).json({
            success: true,
            message: "Question paper uploaded successfully!",
            paper: newQuestionPaper,
        });

    } catch (err) {
        console.error("Upload failed:", err);
        // Provide more specific validation error messages if they exist
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: "Server error during file upload." });
    }
};

const getAllPdfs = async (req, res) => {
    try {
        // Fetch all documents from the QuestionPaper collection.
        const allPapers = await QuestionPaper.find({})
            // Populate 'usedBy' to get the maker's name. If null, it remains null.
            .populate('usedBy', 'name')
            // NEW: Also populate the 'course' field to get the course's title.
            .populate('course', 'title')
            // Sort by newest first for a logical default order.
            .sort({ createdAt: -1 });

        // The response will now include both the maker's name and the course title.
        res.json({ success: true, files: allPapers });

    } catch (err) {
        console.error("Error fetching all PDFs:", err);
        res.status(500).json({ success: false, error: "Server error while fetching PDFs." });
    }
};

// Delete a PDF by ID
const deletePdf = async (req, res) => {
    const { id } = req.params;

    // A transaction is crucial here to ensure all or none of the operations complete.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the document within the transaction to ensure it exists.
        const pdf = await QuestionPaper.findById(id).session(session);
        if (!pdf) {
            // If not found, no need to proceed. Abort transaction.
            throw new Error("Question Paper not found.");
        }

        // 2. Prepare to delete files from Cloudinary.
        const cloudinaryPromises = [];

        // Add the mandatory question paper file to the deletion list.
        if (pdf.questionPaperFile?.publicId) {
            cloudinaryPromises.push(
                cloudinary.uploader.destroy(pdf.questionPaperFile.publicId, {
                    resource_type: "image" // Use 'raw' for PDFs
                })
            );
        }

        // If an optional solution paper exists, add it to the deletion list.
        if (pdf.solutionPaperFile?.publicId) {
            cloudinaryPromises.push(
                cloudinary.uploader.destroy(pdf.solutionPaperFile.publicId, {
                    resource_type: "image" // Use 'raw' for PDFs
                })
            );
        }

        // Execute all Cloudinary deletions in parallel.
        await Promise.all(cloudinaryPromises);

        // 3. IMPORTANT: Delete all questions that are linked to this question paper.
        // This prevents orphaned questions in your database.
        await Question.deleteMany({ questionPaper: id }).session(session);

        // 4. Finally, delete the QuestionPaper document from the database.
        await QuestionPaper.findByIdAndDelete(id).session(session);

        // 5. If all steps were successful, commit the transaction.
        await session.commitTransaction();

        res.json({ success: true, message: "Question Paper and all associated questions deleted successfully." });

    } catch (err) {
        // If any step fails, abort the transaction to undo all changes.
        await session.abortTransaction();

        console.error("Error deleting PDF:", err);

        if (err.message.includes("not found")) {
            return res.status(404).json({ success: false, error: err.message });
        }

        res.status(500).json({ success: false, error: "Server error during deletion. Operation was rolled back." });
    } finally {
        // Always end the session.
        session.endSession();
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

const getDashboardStats = async (req, res) => {
    try {
        const { timeframe = 'all', startDate: start, endDate: end } = req.query;
        const { startDate, endDate } = getDateRange(timeframe, start, end);

        // --- 1. Summary Card Statistics (Corrected) ---
        const totalApprovedData = await Checker.aggregate([
            { $unwind: '$checkeracceptedquestion' },
            { $unwind: '$checkeracceptedquestion.actionDates' },
            {
                $match: {
                    'checkeracceptedquestion.actionDates': {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            { $count: 'totalApproved' }
        ]);
        const totalApproved = totalApprovedData[0]?.totalApproved || 0;

        const totalRejectedData = await Checker.aggregate([
            { $unwind: '$checkerrejectedquestion' },
            { $unwind: '$checkerrejectedquestion.actionDates' },
            {
                $match: {
                    'checkerrejectedquestion.actionDates': {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            { $count: 'totalRejected' }
        ]);
        const totalRejected = totalRejectedData[0]?.totalRejected || 0;

        const [
            totalCreated,
            totalResubmitted,
            currentTotalPending,
        ] = await Promise.all([
            Question.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            Question.countDocuments({
                status: 'Pending',
                makerComments: { $exists: true, $ne: "" },
                updatedAt: { $gte: startDate, $lte: endDate }
            }),
            Question.countDocuments({ status: 'Pending' })
        ]);

        // --- 2. Status Distribution (Unchanged, this is correct) ---
        const statusDistribution = await Question.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } }
        ]);

        // --- 3. Maker Performance Table (REWRITTEN FOR PERFORMANCE) ---
        const makerPerformance = await Question.aggregate([
            // Stage 1: Filter questions by the date range first
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            // Stage 2: Group by maker and calculate stats
            {
                $group: {
                    _id: '$maker',
                    totalCreated: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                    drafted: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } }
                }
            },
            // Stage 3: Lookup the maker's details (name, rejection logs)
            {
                $lookup: {
                    from: 'makers', // Your Maker collection name
                    localField: '_id',
                    foreignField: '_id',
                    as: 'makerDetails'
                }
            },
            { $unwind: '$makerDetails' }, // Deconstruct the makerDetails array
            // Stage 4: Project the final shape, including calculating time-filtered rejections
            {
                $project: {
                    name: '$makerDetails.name',
                    totalCreated: 1,
                    approved: { // NEW CALCULATION
                        $reduce: {
                            input: { $ifNull: ['$makerDetails.makeracceptedquestions', []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    { $size: { $filter: {
                                        input: { $ifNull: ['$$this.actionDates', []] },
                                        as: 'actionDate',
                                        cond: { $and: [{ $gte: ['$$actionDate', startDate] }, { $lte: ['$$actionDate', endDate] }] }
                                    }}}
                                ]
                            }
                        }
                    },
                    pending: 1,
                    drafted: 1,
                    historicalRejections: { // Calculate rejections within the date range from the log
                        $reduce: {
                            input: { $ifNull: ['$makerDetails.makerrejectedquestions', []] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    { $size: { $filter: {
                                        input: { $ifNull: ['$$this.actionDates', []] },
                                        as: 'actionDate',
                                        cond: { $and: [{ $gte: ['$$actionDate', startDate] }, { $lte: ['$$actionDate', endDate] }] }
                                    }}}
                                ]
                            }
                        }
                    },
                    _id: 0
                }
            },
            { $sort: { totalCreated: -1 } },
            { $limit: 10 }
        ]);

        // --- 4. Checker Performance Table (REWRITTEN FOR PERFORMANCE) ---
        const checkerPerformance = await Checker.aggregate([
            {
                $project: {
                    name: '$name',
                    approved: {
                        $reduce: {
                            input: { $ifNull: ['$checkeracceptedquestion', []] },
                            initialValue: 0,
                            in: {
                                $add: [ '$$value', { $size: { $filter: {
                                    input: { $ifNull: ['$$this.actionDates', []] },
                                    as: 'actionDate',
                                    cond: { $and: [{ $gte: ['$$actionDate', startDate] }, { $lte: ['$$actionDate', endDate] }] }
                                }}}]
                            }
                        }
                    },
                    rejected: {
                        $reduce: {
                            input: { $ifNull: ['$checkerrejectedquestion', []] },
                            initialValue: 0,
                            in: {
                                $add: [ '$$value', { $size: { $filter: {
                                    input: { $ifNull: ['$$this.actionDates', []] },
                                    as: 'actionDate',
                                    cond: { $and: [{ $gte: ['$$actionDate', startDate] }, { $lte: ['$$actionDate', endDate] }] }
                                }}}]
                            }
                        }
                    },
                    falseRejections: {
                        $reduce: {
                            input: { $ifNull: ['$checkerfalserejections', []] },
                            initialValue: 0,
                            in: {
                                $add: [ '$$value', { $size: { $filter: {
                                    input: { $ifNull: ['$$this.actionDates', []] },
                                    as: 'actionDate',
                                    cond: { $and: [{ $gte: ['$$actionDate', startDate] }, { $lte: ['$$actionDate', endDate] }] }
                                }}}]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalReviewed: { $add: ['$approved', '$rejected'] }
                }
            },
            { $match: { totalReviewed: { $gt: 0 } } },
            { $sort: { totalReviewed: -1 } },
            { $limit: 10 }
        ]);


        // --- 5. Send all stats in a single, well-structured response ---
        res.json({
            summary: {
                totalCreated, // This is now consistent with the timeframe
                totalApproved,
                totalRejected,
                totalResubmitted,
                totalPending: currentTotalPending, // Correctly named for clarity
            },
            statusDistribution,
            makerPerformance,
            checkerPerformance
        });

    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({ message: "Server error while fetching dashboard statistics." });
    }
};

const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            standard,
            category,
            syllabus,
            examType,
            startDate,
            endDate,
            status
        } = req.body;

        // Basic validation
        if (!title || !standard || !syllabus || !examType) {
            return res.status(400).json({ message: "Please fill in all required fields." });
        }

        // ✅ Check if a course with the same title already exists (case-insensitive)
        const existingCourse = await Course.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
        if (existingCourse) {
            return res.status(409).json({ // 409 Conflict is the appropriate status for duplicates
                message: "A course with this title already exists. Please choose a different title."
            });
        }

        const newCourse = new Course({
            title,
            description,
            standard,
            category,
            syllabus,
            examType,
            startDate,
            endDate,
            status,
            createdBy: req.user._id
        });

        await newCourse.save();

        res.status(201).json({
            success: true,
            message: "Course created successfully!",
            course: newCourse,
        });

    } catch (err) {
        // ✅ Robustly handle the unique constraint error in case of a race condition
        if (err.code === 11000 && err.keyPattern && err.keyPattern.title) {
            return res.status(409).json({ message: "A course with this title already exists." });
        }
        console.error("Error creating course:", err);
        res.status(500).json({ message: "Server error while creating the course." });
    }
};

const getAllCourses = async (req, res) => {
    try {
        // Fetch all course documents
        const courses = await Course.find({})
            .populate("createdBy", "name") // Populates the admin's name who created the course
            .sort({ createdAt: -1 });      // Sort by the most recently created

        res.json(courses);

    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({ message: "Server error while fetching courses." });
    }
};

export { createUser, getAllUsers, uploadPdfs ,getAllPdfs,deletePdf,getDashboardStats,createCourse,getAllCourses ,toggleUserStatus};