const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

// MOCK: Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioelectric-tracker';

// MOCK: User Schema (Copied from schema.ts)
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    programStartDate: { type: Date, required: true },
    currentPhaseNumber: { type: Number, min: 1, max: 4, required: true },
    complianceStreak: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    onboardingComplete: { type: Boolean, default: false },
    preferences: { type: Schema.Types.Mixed, default: {} },
    wizardState: {
        step: { type: String },
        data: { type: Schema.Types.Mixed },
        updatedAt: { type: Date }
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function runTest() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const email = 'repro@test.com';
        const password = 'Test123!';

        // Cleanup first
        await User.deleteOne({ email });

        // 1. Simulate Registration (from src/app/api/auth/register/route.ts)
        console.log('--- Registration ---');
        const existingUser = await User.findOne({ email });
        if (existingUser) throw new Error('User shouldn\'t exist');

        const hashedPassword = await bcrypt.hash(password, 12);
        console.log('Hashed Password during register:', hashedPassword);

        const user = await User.create({
            name: 'Repro User',
            email,
            password: hashedPassword, // Saving the hashed password
            programStartDate: new Date(),
            currentPhaseNumber: 1
        });
        console.log('User created:', user._id);

        // 2. Simulate Login (from src/lib/auth.js)
        console.log('--- Login ---');
        const credentials = { email: 'Repro@test.com', password: 'Test123!' }; // Mixed case email input

        // auth.js logic:
        // Find user by email
        const foundUser = await User.findOne({ email: credentials.email.toLowerCase() }); // Lowercases input

        if (!foundUser) {
            console.log('Login: User not found!');
        } else {
            console.log('Login: User found:', foundUser.email);
            console.log('Stored Password Hash:', foundUser.password);

            // Verify password
            const isValidPassword = await bcrypt.compare(credentials.password, foundUser.password);
            console.log('Password Valid:', isValidPassword);

            if (!isValidPassword) {
                console.log('Invalid password for user:', credentials.email);
            } else {
                console.log('Login SUCCESS!');
            }
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
