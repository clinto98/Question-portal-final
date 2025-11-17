import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';
import checkerRoutes from './src/routes/checkerRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js'
import expertRoutes from './src/routes/expertRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import groqRoutes from './src/routes/groqRoutes.js';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/admin",adminRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/checker", checkerRoutes);
app.use("/api/expert", expertRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/groq", groqRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));