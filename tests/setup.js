const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET_KEY = 'test-secret-very-long-for-jwt-purposes';
  process.env.JWT_EXPIRE_TIME = '1h';
  process.env.JWT_REFRESH_SECRET_KEY = 'test-refresh-secret-very-long-key';
  process.env.JWT_REFRESH_EXPIRE_TIME = '7d';
  process.env.BASE_URL = 'http://localhost:8001';
  process.env.STORAGE_PROVIDER = 'local';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});
