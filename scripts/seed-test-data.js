const fs = require('fs');
const path = require('path');

const generateTestData = () => {
  const startDate = new Date('2024-01-01');
  const today = new Date();
  const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const daysToGenerate = Math.min(daysDiff, 90);

  const productLogs = [];
  const biomarkerLogs = [];
  const progressNotes = [];

  const products = [
    { id: 'prod-1', name: 'Product A' },
    { id: 'prod-2', name: 'Product B' },
    { id: 'prod-3', name: 'Product C' },
  ];

  const biomarkers = ['energy', 'mood', 'sleep', 'digestion', 'pain', 'clarity'];

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];

    const shouldSkip = Math.random() < 0.15;

    if (!shouldSkip) {
      products.forEach((product) => {
        const isLogged = Math.random() < 0.85;
        if (isLogged) {
          productLogs.push({
            productId: product.id,
            productName: product.name,
            date: dateString,
            timestamp: currentDate.toISOString(),
            completed: true,
          });
        }
      });

      const biomarkerValues = {};
      biomarkers.forEach((biomarker) => {
        biomarkerValues[biomarker] = Math.floor(Math.random() * 10) + 1;
      });

      biomarkerLogs.push({
        date: dateString,
        timestamp: currentDate.toISOString(),
        values: biomarkerValues,
      });

      if (Math.random() < 0.3) {
        const notes = [
          'Feeling great today, energy levels are up',
          'Noticed improvement in sleep quality',
          'Some digestive issues, adjusting diet',
          'Mental clarity has improved significantly',
          'Slight fatigue, might need more rest',
          'Overall wellness trending positive',
        ];

        progressNotes.push({
          date: dateString,
          timestamp: currentDate.toISOString(),
          note: notes[Math.floor(Math.random() * notes.length)],
          mood: Math.floor(Math.random() * 5) + 1,
        });
      }
    }
  }

  const onboardingStates = [
    {
      id: 'partial-1',
      currentStep: 1,
      primaryGoal: 'detox',
      completed: false,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'partial-2',
      currentStep: 2,
      primaryGoal: 'energy',
      selectedPhase: 1,
      completed: false,
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'complete',
      currentStep: 4,
      primaryGoal: 'wellness',
      selectedPhase: 2,
      selectedProducts: ['prod-1', 'prod-2'],
      reminderTime: '09:00',
      reminderEnabled: true,
      completed: true,
      completedAt: startDate.toISOString(),
    },
  ];

  return {
    productLogs,
    biomarkerLogs,
    progressNotes,
    onboardingStates,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDays: daysToGenerate,
      skippedDays: daysToGenerate - productLogs.length / products.length,
    },
  };
};

const seedData = () => {
  console.log('🌱 Generating test data...');

  const testData = generateTestData();

  const outputDir = path.join(__dirname, '..', '__tests__', 'fixtures');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'test-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

  console.log(`✅ Test data generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total days: ${testData.metadata.totalDays}`);
  console.log(`   - Product logs: ${testData.productLogs.length}`);
  console.log(`   - Biomarker logs: ${testData.biomarkerLogs.length}`);
  console.log(`   - Progress notes: ${testData.progressNotes.length}`);
  console.log(`   - Skipped days: ${testData.metadata.skippedDays}`);
  console.log(`   - Onboarding states: ${testData.onboardingStates.length}`);

  return testData;
};

if (require.main === module) {
  seedData();
}

module.exports = { generateTestData, seedData };