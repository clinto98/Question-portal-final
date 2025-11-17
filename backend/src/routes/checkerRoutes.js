import express from "express";
import {
    getPendingQuestions,
    approveQuestion,
    rejectQuestion,
    getReviewedQuestions,
    bulkApproveQuestions,
    getQuestionById,
    getPapers,
    getCheckerDashboardStats,
    getReviewedMakers,
    getReviewedCourses,
    getReviewedQuestionPapers,
    getPendingMakers,
    getPendingCourses
} from "../controllers/checkerController.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { loadPricing } from "../middlewares/pricingMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(loadPricing);

router.get("/questions/pending", authorize('checker'), getPendingQuestions);
router.put("/questions/:id/approve", authorize('checker'), approveQuestion);
router.put("/questions/:id/reject", authorize('checker'), rejectQuestion);
router.put('/questions/approve-bulk', authorize('checker'), bulkApproveQuestions);
router.get("/questions/reviewed", authorize('checker'), getReviewedQuestions);
router.get('/papers/claimed', authorize('checker'), getPapers);
router.get('/dashboard', authorize('checker'), getCheckerDashboardStats);
router.get("/questions/:id", authorize('checker', 'admin'), getQuestionById);

router.get("/reviewed/makers", authorize('checker'), getReviewedMakers);
router.get("/reviewed/courses", authorize('checker'), getReviewedCourses);
router.get("/reviewed/question-papers", authorize('checker'), getReviewedQuestionPapers);

router.get("/pending/makers", authorize('checker'), getPendingMakers);
router.get("/pending/courses", authorize('checker'), getPendingCourses);


export default router;