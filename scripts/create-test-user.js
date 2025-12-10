/**
 * Test user creation script for the Bioelectric Regeneration Tracker
 * 
 * This script creates a test user account for development purposes
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
const { User, Phase } = require('../models/schema');

// Test user data
const testUser = {
  email: "test@example.com",
  password: "Test123!",
  name: "Test User",
  programStartDate: new Date(),
  currentPhaseNumber: 1
};

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log(`Test user ${testUser.email} already exists`);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);
    
    // Create user with hashed password
    const user = new User({
      ...testUser,
      password: hashedPassword
    });
    
    await user.save();
    console.log(`Test user created: ${user.email}`);
    
    // Initialize the user's phases
    console.log('Initializing user phases...');
    // This would typically call a function to set up the user's 4 phases
    // e.g., await initializeUserPhases(user._id);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createTestUser();
