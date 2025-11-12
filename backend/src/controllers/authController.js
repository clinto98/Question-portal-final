import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

import Maker from "../models/Maker.js";
import Checker from "../models/Checker.js";
import Admin from "../models/Admin.js";
import Expert from "../models/Expert.js";

// Generic login handler
const handleLogin = async (Model, type, req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Model.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check if user is active
        if (type !== "admin" && !user.isActive) {
            return res.status(401).json({ message: "Your account has been deactivated. Please contact an administrator." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken({
            id: user._id,
            email: user.email,
            type: type, // "maker" | "checker" | "admin" | "expert"
        });

        return res.json({
            message: `${type} login successful`,
            token,
            user: {
                id: user._id,
                email: user.email,
                type: type,
            },
        });
    } catch (err) {
        console.error(`${type} login error:`, err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Separate login controllers
const loginMaker = (req, res) => handleLogin(Maker, "maker", req, res);
const loginChecker = (req, res) => handleLogin(Checker, "checker", req, res);
const loginAdmin = (req, res) => handleLogin(Admin, "admin", req, res);
const loginExpert = (req, res) => handleLogin(Expert, "expert", req, res);

const updateMakerPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const makerId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Please provide both old and new passwords." });
    }

    try {
        const maker = await Maker.findById(makerId).select("+password");
        if (!maker) {
            return res.status(404).json({ message: "Maker not found." });
        }

        const isMatch = await bcrypt.compare(oldPassword, maker.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect old password." });
        }

        maker.password = await bcrypt.hash(newPassword, 10);
        await maker.save();

        res.json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Update maker password error:", error.message);
        res.status(500).json({ message: "Server error." });
    }
};

export { loginMaker, loginChecker, loginAdmin, loginExpert, updateMakerPassword };