import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import Demo from "../src/models/Demo.js";

dotenv.config();

// --- Configuration ---
const BATCH_SIZE = 10;
const API_ENDPOINT = "https://api.openmcq.com/api/questionpaper/Questionsreceive";
const API_KEY = process.env.OPENMCQ_API_KEY;

const migrateDemoToProduction = async () => {
  let successCount = 0;
  let failureCount = 0;
  const failedRecordIds = [];

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const totalDocuments = await Demo.countDocuments();
    if (totalDocuments === 0) {
      console.log("No documents found in the Demo collection to migrate.");
      return;
    }

    const totalBatches = Math.ceil(totalDocuments / BATCH_SIZE);
    console.log(`Starting migration of ${totalDocuments} documents in ${totalBatches} batches...`);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      console.log(`--- Processing Batch ${batchNum + 1} of ${totalBatches} ---`);
      const documents = await Demo.find()
        .skip(batchNum * BATCH_SIZE)
        .limit(BATCH_SIZE);

      const promises = documents.map(doc => {
        const apiPayload = doc.toObject();
        return axios.post(API_ENDPOINT, apiPayload, {
          headers: {
            "X-API-KEY": API_KEY,
            "Content-Type": "application/json",
          },
        }).then(() => ({ status: 'fulfilled', id: doc._id }))
          .catch(error => ({ status: 'rejected', id: doc._id, error }));
      });

      const results = await Promise.allSettled(promises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
          successCount++;
          console.log(`  Successfully migrated document ID: ${result.value.id}`);
        } else {
          failureCount++;
          const failedResult = result.status === 'rejected' ? result.reason : result.value;
          failedRecordIds.push(failedResult.id);
          console.error(`  Failed to migrate document ID: ${failedResult.id}`, failedResult.error?.response?.data || failedResult.error?.message);
        }
      });
    }

  } catch (error) {
    console.error("An unexpected error occurred during the migration process:", error);
  } finally {
    console.log("\n--- Migration Summary ---");
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed to migrate: ${failureCount}`);
    if (failedRecordIds.length > 0) {
      console.log("Failed record IDs:", failedRecordIds.join(", "));
    }
    console.log("-------------------------");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

migrateDemoToProduction();
