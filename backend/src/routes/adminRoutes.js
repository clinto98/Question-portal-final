import express from "express";
import { protect, authorize } from "../middlewares/authmiddleware.js";
import { loadPricing } from "../middlewares/pricingMiddleware.js";
import { createUser, getAllUsers, toggleUserStatus ,uploadPdfs ,getAllPdfs , deletePdf , getDashboardStats,createCourse ,getAllCourses, getUsersByRole, getReport, downloadReport, recordPayment, getUserTransactions, getPricing, updatePricing} from "../controllers/adminController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Only admin can access these routes
router.use(protect);
router.use(authorize("admin"));
router.use(loadPricing);

// Create a user
router.post("/create-user", createUser);

// Get all users
router.get("/users", getAllUsers);

// Get users by role
router.get("/users/:role", getUsersByRole);

// Get report data
router.get("/report", getReport);

// Download report data
router.get("/report/download", downloadReport);

// Delete a user
router.patch("/user/:role/:id/status", toggleUserStatus);

//upload pdf function
router.post(
    "/pdfs",
    upload.fields([
        { name: 'questionPaper', maxCount: 1 },
        { name: 'solutionPaper', maxCount: 1 }
    ]),
    uploadPdfs
);

// Get all PDFs
router.get("/pdfs", getAllPdfs);

// Delete a PDF
router.delete("/pdfs/:id", deletePdf);

router.get("/dashboard-stats", protect, authorize('admin'), getDashboardStats)

router.post('/courses', createCourse);

router.get('/courses', getAllCourses);

// Payout routes
router.post('/payout', recordPayment);
router.get('/payout/transactions/:userId', getUserTransactions);

// Pricing routes
router.get("/pricing", getPricing);
router.put("/pricing", updatePricing);

export default router;
