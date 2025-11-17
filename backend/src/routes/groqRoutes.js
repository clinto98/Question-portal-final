import express from "express";
import { generateExplanationWithGroq } from "../controllers/groqController.js";
import upload from "../middlewares/uploadmiddleware.js";

const router = express.Router();

// @route   POST /api/groq/generate-explanation
// @desc    Generate an explanation for a question using Groq
// @access  Private (Maker)
router.post(
  "/generate-explanation",
  upload.fields([
    { name: 'questionImage', maxCount: 1 },
    { name: 'choiceImages', maxCount: 4 } // Assuming max 4 choices
  ]),
  generateExplanationWithGroq
);

export default router;
