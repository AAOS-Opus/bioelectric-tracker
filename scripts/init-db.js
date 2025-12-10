const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.production.local' });

const PHASE_DATA = [
  {
    phaseNumber: 1,
    name: 'Foundation Phase',
    description: 'Establish baseline wellness and prepare the body for deeper healing',
    duration: 30,
    objectives: [
      'Build foundational health habits',
      'Assess current biomarkers',
      'Prepare body for cellular regeneration'
    ],
    protocols: ['Basic detox support', 'Sleep optimization', 'Stress reduction']
  },
  {
    phaseNumber: 2,
    name: 'Cellular Activation',
    description: 'Activate cellular repair mechanisms and optimize energy production',
    duration: 30,
    objectives: [
      'Enhance mitochondrial function',
      'Support cellular detoxification',
      'Optimize nutrient absorption'
    ],
    protocols: ['Mitochondrial support', 'Cellular detox', 'Energy optimization']
  },
  {
    phaseNumber: 3,
    name: 'Deep Detoxification',
    description: 'Eliminate stored toxins and support organ regeneration',
    duration: 30,
    objectives: [
      'Clear cellular debris',
      'Support liver and kidney function',
      'Restore gut health'
    ],
    protocols: ['Liver support', 'Kidney cleanse', 'Gut restoration']
  },
  {
    phaseNumber: 4,
    name: 'Tissue Regeneration',
    description: 'Support tissue repair and structural restoration',
    duration: 30,
    objectives: [
      'Rebuild damaged tissues',
      'Support collagen production',
      'Enhance structural integrity'
    ],
    protocols: ['Collagen support', 'Tissue repair', 'Inflammation reduction']
  },
];

async function initializeDatabase() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Create .env.production.local with DATABASE_URL');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  console.log(`   URI: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log('✅ Connected to database successfully');

    // Create collections and indexes
    console.log('\n📚 Setting up collections and indexes...');

    // Phases collection
    const phasesCollection = db.collection('phases');
    await phasesCollection.createIndex({ phaseNumber: 1 }, { unique: true });
    console.log('✓ Created index on phases.phaseNumber');

    // User phases collection
    const userPhasesCollection = db.collection('user_phases');
    await userPhasesCollection.createIndex({ userId: 1, phaseNumber: 1 });
    await userPhasesCollection.createIndex({ userId: 1, startDate: -1 });
    console.log('✓ Created indexes on user_phases');

    // Products collection
    const productsCollection = db.collection('products');
    await productsCollection.createIndex({ userId: 1 });
    await productsCollection.createIndex({ phaseNumber: 1 });
    console.log('✓ Created indexes on products');

    // Product usage logs
    const productUsageCollection = db.collection('product_usage');
    await productUsageCollection.createIndex({ userId: 1, date: -1 });
    await productUsageCollection.createIndex({ productId: 1, date: -1 });
    console.log('✓ Created indexes on product_usage');

    // Biomarker logs
    const biomarkerLogsCollection = db.collection('biomarker_logs');
    await biomarkerLogsCollection.createIndex({ userId: 1, date: -1 });
    console.log('✓ Created indexes on biomarker_logs');

    // Progress notes
    const progressNotesCollection = db.collection('progress_notes');
    await progressNotesCollection.createIndex({ userId: 1, createdAt: -1 });
    console.log('✓ Created indexes on progress_notes');

    // Notifications
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.createIndex({ userId: 1, createdAt: -1 });
    await notificationsCollection.createIndex({ userId: 1, read: 1 });
    console.log('✓ Created indexes on notifications');

    // Insert phase data
    console.log('\n📊 Seeding phase data...');
    const existingPhases = await phasesCollection.countDocuments();

    if (existingPhases === 0) {
      await phasesCollection.insertMany(PHASE_DATA);
      console.log(`✅ Inserted ${PHASE_DATA.length} phases`);
    } else {
      console.log(`⚠️  Found ${existingPhases} existing phases, skipping insert`);

      // Update existing phases with new data
      for (const phase of PHASE_DATA) {
        await phasesCollection.updateOne(
          { phaseNumber: phase.phaseNumber },
          { $set: phase },
          { upsert: true }
        );
      }
      console.log('✅ Updated phase data');
    }

    // Create default biomarkers
    console.log('\n🔬 Setting up default biomarkers...');
    const biomarkersCollection = db.collection('biomarkers');
    await biomarkersCollection.createIndex({ key: 1 }, { unique: true });

    const defaultBiomarkers = [
      { key: 'energy', name: 'Energy Level', unit: 'scale', range: { min: 1, max: 10 } },
      { key: 'mood', name: 'Mood', unit: 'scale', range: { min: 1, max: 10 } },
      { key: 'sleep', name: 'Sleep Quality', unit: 'scale', range: { min: 1, max: 10 } },
      { key: 'digestion', name: 'Digestion', unit: 'scale', range: { min: 1, max: 10 } },
      { key: 'pain', name: 'Pain Level', unit: 'scale', range: { min: 1, max: 10 } },
      { key: 'clarity', name: 'Mental Clarity', unit: 'scale', range: { min: 1, max: 10 } },
    ];

    for (const biomarker of defaultBiomarkers) {
      await biomarkersCollection.updateOne(
        { key: biomarker.key },
        { $set: biomarker },
        { upsert: true }
      );
    }
    console.log(`✅ Configured ${defaultBiomarkers.length} default biomarkers`);

    // Database statistics
    console.log('\n📈 Database Statistics:');
    const collections = await db.listCollections().toArray();
    console.log(`   Total collections: ${collections.length}`);

    const stats = {
      phases: await phasesCollection.countDocuments(),
      biomarkers: await biomarkersCollection.countDocuments(),
    };

    console.log(`   Phases: ${stats.phases}`);
    console.log(`   Biomarkers: ${stats.biomarkers}`);

    console.log('\n✅ Database initialization complete!');
    console.log('   You can now start the application\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run initialization
initializeDatabase();