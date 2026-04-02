const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');
const fs = require('fs');

async function debugUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email role');
        let out = `TOTAL USERS: ${users.length}\n`;
        users.forEach((u, i) => {
            out += `[${i}] NAME: "${u.name}", EMAIL: "${u.email}", ROLE: "${u.role}"\n`;
        });
        fs.writeFileSync('user_debug_log.txt', out);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('user_debug_log.txt', 'ERROR: ' + err.message);
    }
}

debugUsers();
