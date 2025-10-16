import express from "express";
import {  loginMaker, loginChecker,loginAdmin, loginExpert } from "../controllers/authController.js";

const router = express.Router();

// separate login endpoints
router.post("/login/admin", loginAdmin);
router.post("/login/maker", loginMaker);
router.post("/login/checker", loginChecker);
router.post("/login/expert", loginExpert);

export default router;

