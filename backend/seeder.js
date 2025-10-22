import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Admin from "./src/models/Admin.js"; // ✅ Import Admin model
import Pricing from "./src/models/Pricing.js"; // ✅ Import Pricing model
import { PRICING } from "./src/constants/pricing.js"; // ✅ Import pricing data

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Seed Admin
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash("mahroof123", 10);
            const admin = {
                name: "Mahroof M P",
                email: "mahroof@finlyntyx.com",
                password: hashedPassword,
            };
            await Admin.create(admin);
            console.log("✅ Admin seeded successfully");
            console.log("👉 Admin login: mahroof@finlyntyx.com / mahroof123");
        } else {
            console.log("ℹ️ Admin already seeded");
        }

        // Seed Pricing
        const pricingCount = await Pricing.countDocuments();
        if (pricingCount === 0) {
            await Pricing.create(PRICING);
            console.log("✅ Pricing seeded successfully");
        } else {
            console.log("ℹ️ Pricing already seeded");
        }

        process.exit();
    } catch (err) {
        console.error("❌ Error seeding data:", err);
        process.exit(1);
    }
}

seed();
