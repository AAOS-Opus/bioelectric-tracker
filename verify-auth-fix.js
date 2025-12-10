const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bioelectric-tracker';

// Mock schema (consistent with real app)
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    programStartDate: { type: Date, required: true },
    currentPhaseNumber: { type: Number, min: 1, max: 4, required: true },
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function verifyAuthFix() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const rawEmail = '  NewUser@Test.com  ';
        const cleanEmail = rawEmail.toLowerCase().trim();
        const password = 'Test123!';

        // Cleanup
        await User.deleteMany({ email: cleanEmail });

        // 1. Simulate Register (New Logic: Normalized)
        console.log('--- Registering with input:', `"${rawEmail}"`);
        const hashedPassword = await bcrypt.hash(password, 12);

        // Logic from register/route.ts
        const user = await User.create({
            name: 'Verified User',
            email: cleanEmail, // NORMALIZED
            password: hashedPassword,
            programStartDate: new Date(),
            currentPhaseNumber: 1
        });
        console.log('User created with email:', `"${user.email}"`);

        // 2. Simulate Login (New Logic: auth.ts normalized)
        console.log('--- Logging in with input:', `"${rawEmail}"`);
        // Logic from auth.ts
        const foundUser = await User.findOne({
            email: cleanEmail // NORMALIZED
        });

        if (!foundUser) {
            throw new Error('Login failed: User not found despite registration!');
        }

        const isValid = await bcrypt.compare(password, foundUser.password);
        if (!isValid) {
            throw new Error('Login failed: Password mismatch!');
        }

        console.log('SUCCESS: User registered and logged in correctly!');

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAuthFix();
