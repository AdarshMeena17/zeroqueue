require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const assertSafeDatabase = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI must be set to an approved local development/test database.');
  }

  if (!['development', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error('Seed script requires NODE_ENV=development or NODE_ENV=test.');
  }

  if (process.env.ALLOW_DESTRUCTIVE_DB_SCRIPTS !== 'true') {
    throw new Error('Set ALLOW_DESTRUCTIVE_DB_SCRIPTS=true to explicitly enable database seeding.');
  }

  let database;
  let hostname;
  let protocol;
  try {
    const parsed = new URL(uri);
    protocol = parsed.protocol;
    hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    database = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error('MONGO_URI must be a valid MongoDB URI for an approved local database.');
  }

  if (protocol !== 'mongodb:') {
    throw new Error('Seed script only permits a direct local MongoDB URI; SRV/remote configurations are blocked.');
  }

  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Seed script only permits MongoDB on this machine; remote/production hosts are blocked.');
  }

  if (!['queuezero', 'queuezero_dev', 'queuezero_test'].includes(database)) {
    throw new Error('Seed script only permits the queuezero development/test databases.');
  }
};

const seedData = async () => {
  try {
    assertSafeDatabase();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding');

    // Check if seeded users exist to avoid duplicates
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    const existingStaff = await User.findOne({ email: 'staff@example.com' });
    const existingUser = await User.findOne({ email: 'user@example.com' });

    if (existingAdmin || existingStaff || existingUser) {
      console.log('Seed users already exist. Deleting existing seed users...');
      await User.deleteMany({ email: { $in: ['admin@example.com', 'staff@example.com', 'user@example.com'] }});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('devPassword123!', salt);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      },
      {
        name: 'Staff User',
        email: 'staff@example.com',
        password: hashedPassword,
        role: 'staff',
      },
      {
        name: 'Normal User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
      }
    ];

    await User.insertMany(users);
    console.log('Successfully seeded admin, staff, and normal user!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
