/**
 * Reset test user script for the Bioelectric Regeneration Tracker
 * 
 * This script updates/resets the test user account with a known password
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string from environment or default for local development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioelectric';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Import User model from schema.js
const { User } = require('../models/schema');

// Test user data with known password
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "Test123!";

async function resetTestUser() {
  try {
    // Find the test user
    const user = await User.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log(`Test user ${TEST_EMAIL} not found. Please run db-seed.js first.`);
      return;
    }
    
    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
    
    // Update user with new hashed password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`Test user ${TEST_EMAIL} password reset successfully`);
    console.log(`Use email: ${TEST_EMAIL} and password: ${TEST_PASSWORD} to log in`);
    
  } catch (error) {
    console.error('Error resetting test user password:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
resetTestUser();
