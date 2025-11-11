import express from "express";
import { generateExplanation } from "../controllers/aiController.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

// @route   POST /api/ai/generate-explanation
// @desc    Generate an explanation for a question, now with image support
// @access  Private (Maker)
router.post(
  "/generate-explanation",
  upload.fields([
    { name: 'questionImage', maxCount: 1 },
    { name: 'choiceImages', maxCount: 4 } // Assuming max 4 choices
  ]),
  generateExplanation
);

export default router;
