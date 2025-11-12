import express from "express";
import {  loginMaker, loginChecker,loginAdmin, loginExpert, updateMakerPassword } from "../controllers/authController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

// separate login endpoints
router.post("/login/admin", loginAdmin);
router.post("/login/maker", loginMaker);
router.post("/login/checker", loginChecker);
router.post("/login/expert", loginExpert);

// Update password for maker
router.put("/update-password/maker", protect, updateMakerPassword);

export default router;

