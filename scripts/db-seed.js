/**
 * Database seed script for the Bioelectric Regeneration Tracker
 * 
 * This script connects to MongoDB and inserts sample data for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const seedData = require('./seed-database');

// MongoDB connection string from environment or default for local development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioelectric';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Import models from schema.js
const { User, Product, Modality, Phase, ProgressNote } = require('../models/schema');

// Biomarker model (if not included in schema.js)
const BiomarkerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  optimalRange: { type: String, required: true },
  description: { type: String, required: true }
});
const Biomarker = mongoose.model('Biomarker', BiomarkerSchema);

async function seedDatabase() {
  try {
    console.log('Clearing existing data...');
    
    // Clear existing data
    await Promise.all([
      User.deleteMany({ email: seedData.testUser.email }),
      Product.deleteMany({}),
      Modality.deleteMany({}),
      Phase.deleteMany({}),
      Biomarker.deleteMany({})
    ]);
    
    console.log('Inserting products...');
    const insertedProducts = await Product.insertMany(seedData.products);
    console.log(`${insertedProducts.length} products inserted`);
    
    console.log('Inserting modalities...');
    const insertedModalities = await Modality.insertMany(seedData.modalities);
    console.log(`${insertedModalities.length} modalities inserted`);
    
    console.log('Inserting biomarkers...');
    const insertedBiomarkers = await Biomarker.insertMany(seedData.biomarkers);
    console.log(`${insertedBiomarkers.length} biomarkers inserted`);
    
    console.log('Inserting phases...');
    const insertedPhases = await Phase.insertMany(seedData.phases);
    console.log(`${insertedPhases.length} phases inserted`);
    
    console.log('Creating test user...');
    // Hash password for test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(seedData.testUser.password, salt);
    
    // Create user with hashed password
    const testUser = new User({
      ...seedData.testUser,
      password: hashedPassword
    });
    
    await testUser.save();
    console.log(`Test user created: ${testUser.email}`);
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedDatabase();
