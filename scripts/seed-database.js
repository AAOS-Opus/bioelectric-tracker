/**
 * Database seeding script for the Bioelectric Regeneration Tracker
 * 
 * This script populates the MongoDB database with sample data for testing purposes.
 */

// Sample data for products
const products = [
  {
    name: "Mitochondrial Complex I",
    category: "Mitochondrial",
    description: "Supports ATP production and cellular energy",
    dosageInstructions: "2 capsules",
    frequency: "Daily",
    image: "/images/products/mito-complex.jpg"
  },
  {
    name: "NRF2 Activator",
    category: "Detox",
    description: "Activates cellular detoxification pathways",
    dosageInstructions: "1 capsule",
    frequency: "Twice daily",
    image: "/images/products/nrf2.jpg"
  },
  {
    name: "Liver Support Formula",
    category: "Detox",
    description: "Comprehensive blend of herbs for liver detoxification",
    dosageInstructions: "2 capsules",
    frequency: "Morning and evening",
    image: "/images/products/liver-support.jpg"
  },
  {
    name: "CoQ10 Complex",
    category: "Mitochondrial",
    description: "Enhances cellular energy production",
    dosageInstructions: "1 capsule",
    frequency: "Daily with food",
    image: "/images/products/coq10.jpg"
  },
];

// Sample data for modalities
const modalities = [
  {
    name: "Spooky2 Scalar",
    description: "Scalar wave therapy for cellular communication enhancement",
    recommendedFrequency: "Daily"
  },
  {
    name: "Magnetic Wave Oscillator",
    description: "Pulsed electromagnetic field therapy for cellular regeneration",
    recommendedFrequency: "3 times per week"
  },
  {
    name: "Biocharger",
    description: "Resonant plasma energy system for whole body wellness",
    recommendedFrequency: "2 times per week"
  }
];

// Sample data for phases
const phases = [
  {
    phaseNumber: 1,
    name: "Phase 1: Preparation",
    description: "Preparing the body for detoxification by supporting elimination pathways",
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    affirmationText: "I am preparing my body for optimal healing",
    isCompleted: false
  },
  {
    phaseNumber: 2,
    name: "Phase 2: Deep Detoxification",
    description: "Mobilizing and removing stored toxins from tissues",
    startDate: new Date(new Date().setDate(new Date().getDate() + 31)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 90)),
    affirmationText: "I am releasing toxins and embracing renewal",
    isCompleted: false
  },
  {
    phaseNumber: 3,
    name: "Phase 3: Mitochondrial Restoration",
    description: "Rebuilding cellular energy production capacity",
    startDate: new Date(new Date().setDate(new Date().getDate() + 91)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 135)),
    affirmationText: "My cells are energized and vibrant",
    isCompleted: false
  },
  {
    phaseNumber: 4,
    name: "Phase 4: Cellular Regeneration",
    description: "Supporting the body's natural healing and regenerative processes",
    startDate: new Date(new Date().setDate(new Date().getDate() + 136)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 195)),
    affirmationText: "My body regenerates with perfect intelligence",
    isCompleted: false
  }
];

// Sample biomarkers for tracking
const biomarkers = [
  {
    name: "Glutathione",
    category: "Detoxification",
    unit: "μmol/L",
    optimalRange: "900-1200",
    description: "Master antioxidant, essential for detoxification"
  },
  {
    name: "ATP",
    category: "Mitochondrial Function",
    unit: "μmol/L",
    optimalRange: "4.5-6.0",
    description: "Cellular energy currency produced by mitochondria"
  },
  {
    name: "GGT",
    category: "Liver Function",
    unit: "U/L",
    optimalRange: "10-30",
    description: "Enzyme that indicates liver stress and function"
  },
  {
    name: "HRV",
    category: "Autonomic Function",
    unit: "ms",
    optimalRange: "50-100",
    description: "Heart rate variability, indicates autonomic nervous system balance"
  }
];

// Sample test user data
const testUser = {
  email: "test@example.com",
  password: "Test123!",
  name: "Test User",
  programStartDate: new Date(),
  currentPhaseNumber: 1
};

// Export the seed data
module.exports = {
  products,
  modalities,
  phases,
  biomarkers,
  testUser
};

// If this script is run directly
if (require.main === module) {
  console.log("Seeding script loaded. This script should be imported by a MongoDB connection script.");
  console.log("Sample data available:");
  console.log(`- ${products.length} products`);
  console.log(`- ${modalities.length} modalities`);
  console.log(`- ${phases.length} phases`);
  console.log(`- ${biomarkers.length} biomarkers`);
}
