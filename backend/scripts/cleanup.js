require('dotenv').config();
const mongoose = require('mongoose');

const assertSafeDatabase = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI must be set to an approved local development/test database.');
  }

  if (!['development', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error('Cleanup script requires NODE_ENV=development or NODE_ENV=test.');
  }

  if (process.env.ALLOW_DESTRUCTIVE_DB_SCRIPTS !== 'true') {
    throw new Error('Set ALLOW_DESTRUCTIVE_DB_SCRIPTS=true to explicitly enable database cleanup.');
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
    throw new Error('Cleanup script only permits a direct local MongoDB URI; SRV/remote configurations are blocked.');
  }

  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Cleanup script only permits MongoDB on this machine; remote/production hosts are blocked.');
  }

  if (!['queuezero', 'queuezero_dev', 'queuezero_test'].includes(database)) {
    throw new Error('Cleanup script only permits the queuezero development/test databases.');
  }
};

async function clean() {
  assertSafeDatabase();
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.collection('users').deleteMany({ email: { $in: ['reg@example.com', 'staffesc@example.com', 'adminesc@example.com'] } });
  console.log('Cleaned up test users');
  process.exit(0);
}
clean();
