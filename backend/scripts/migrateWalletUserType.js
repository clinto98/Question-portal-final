/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Import Models
import Wallet from '../src/models/Wallet.js';
import Maker from '../src/models/Maker.js';
import Checker from '../src/models/Checker.js';
import Expert from '../src/models/Expert.js';

// Load Environment Variables
dotenv.config({ path: './backend/.env' });

const migrateWallets = async () => {

  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // Find all wallets that do not have the userType field
    const walletsToMigrate = await Wallet.find({ userType: { $exists: false } });

    if (walletsToMigrate.length === 0) {
      console.log('No wallets to migrate. All wallets already have a userType.');
      return;
    }

    console.log(`Found ${walletsToMigrate.length} wallets to migrate.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const wallet of walletsToMigrate) {
      const userId = wallet.user;
      let foundType = null;

      // Check in which collection the user exists
      const isMaker = await Maker.findById(userId);
      if (isMaker) {
        foundType = 'Maker';
      } else {
        const isChecker = await Checker.findById(userId);
        if (isChecker) {
          foundType = 'Checker';
        } else {
          const isExpert = await Expert.findById(userId);
          if (isExpert) {
            foundType = 'Expert';
          }
        }
      }

      if (foundType) {
        wallet.userType = foundType;
        await wallet.save();
        console.log(`  - Updated wallet for user ${userId} with type: ${foundType}`);
        updatedCount++;
      } else {
        console.warn(`  - FAILED: Could not find user type for wallet with user ID: ${userId}`);
        failedCount++;
      }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Successfully updated: ${updatedCount} wallets.`);
    console.log(`Failed to update: ${failedCount} wallets.`);

  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('MongoDB Disconnected.');
    }
    process.exit(failedCount > 0 ? 1 : 0);
  }
};

migrateWallets();
