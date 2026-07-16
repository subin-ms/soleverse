const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/userModel');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'testuser@example.com';
        const passwordHash = await bcrypt.hash('Password123', 10);

        let user = await User.findOne({ email });
        if (user) {
            user.password = passwordHash;
            user.isVerified = true;
            user.wallet = 10000;
            user.isBlocked = false;
            await user.save();
            console.log('Existing test user updated:', email);
        } else {
            user = new User({
                name: 'Test User',
                email,
                password: passwordHash,
                isVerified: true,
                wallet: 10000,
                isBlocked: false
            });
            await user.save();
            console.log('New test user created:', email);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error creating test user:', err);
    }
}

run();
