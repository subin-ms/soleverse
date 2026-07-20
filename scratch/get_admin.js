const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');

async function getAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' });
  console.log(admin._id);
  process.exit(0);
}
getAdmin();
