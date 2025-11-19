import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import QuestionPaper from "../src/models/QuestionPaper.js";

// Construct an absolute path to the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../backend/.env');

// Load environment variables from the absolute path
dotenv.config({ path: envPath });

const migrateStatus = async () => {
  if (!process.env.MONGO_URI) {
    console.error(`MONGO_URI not found. Looked for .env file at: ${envPath}`);
    console.error("Please ensure the MONGO_URI is configured correctly.");
    process.exit(1);
  }

  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration.");

    console.log("Starting migration to add 'status' field to existing question papers...");

    // Update all QuestionPaper documents where the 'status' field does not exist
    const result = await QuestionPaper.updateMany(
      { status: { $exists: false } }, // Filter: only documents without a 'status' field
      { $set: { status: 'approved' } } // Update: set the 'status' field to 'approved'
    );

    console.log("\n--- Migration Report ---");
    console.log(`Total documents matched for migration: ${result.matchedCount}`);
    console.log(`Total documents successfully updated: ${result.modifiedCount}`);
    console.log("------------------------\n");
    console.log("Migration completed successfully.");

  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    // Disconnect from the database and exit the process
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

// Run the migration
migrateStatus();
