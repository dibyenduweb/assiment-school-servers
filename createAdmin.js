// backend/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@rkvm.edu.in';
const ADMIN_PASSWORD = 'admin123';

async function createAdmin() {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Hash the Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 3. Insert Admin User
    const result = await mongoose.connection.db.collection('users').insertOne({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date()
    });

    console.log('✅ Admin account created successfully!');
    console.log('------------------------------------------');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('------------------------------------------');
    console.log('⚠️ You can now login at http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createAdmin();