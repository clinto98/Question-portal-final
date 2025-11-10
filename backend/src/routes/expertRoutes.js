import express from "express";
import {
    getApprovedQuestions,
    getFinalizedQuestions,
    getQuestionById,
    getFinalizedQuestionById,
    approveQuestion,
    getApprovedQuestionCourses,
    getApprovedQuestionSubjects,
    getFinalizedQuestionCourses,
    getFinalizedQuestionSubjects,
} from "../controllers/expertController.js";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

// All routes in this file are protected and restricted to experts
router.use(protect, authorize("expert"));

router.get("/questions", getApprovedQuestions);
router.get("/courses", getApprovedQuestionCourses);
router.get("/subjects", getApprovedQuestionSubjects);
router.get("/finalized-courses", getFinalizedQuestionCourses);
router.get("/finalized-subjects", getFinalizedQuestionSubjects);
router.get("/questions/finalized", getFinalizedQuestions);
router.get("/questions/:id", getQuestionById);
router.get("/finalized-questions/:id", getFinalizedQuestionById);
router.post("/questions/:id/approve", upload.fields([
    { name: 'questionImage', maxCount: 1 },
    { name: 'explanationImage', maxCount: 1 },
    { name: 'choicesImage', maxCount: 10 },
    { name: 'referenceImage1', maxCount: 1 },
    { name: 'referenceImage2', maxCount: 1 },
]), approveQuestion);

export default router;
