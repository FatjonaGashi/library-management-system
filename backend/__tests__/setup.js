// backend/__tests__/setup.js

const mongoose = require('mongoose');
const http = require('http');
const https = require('https');
const app = require('../server');

// Set environment to test BEFORE anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/library_test';

// Increase timeout
jest.setTimeout(30000);

// Ensure HTTP global agents do not use keep-alive to prevent open sockets in tests
http.globalAgent.keepAlive = false;
https.globalAgent.keepAlive = false;

// Connect to test database before all tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Test database connected');
    // Start the server once for all tests to avoid per-request server creation and lingering sockets
    global.__TEST_SERVER__ = app.listen(0);
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Only drop and close if the connection is active to avoid "buffering timed out" errors
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      console.log('✅ Test database cleaned and closed');
    } else {
      console.log('⚠️ Test: No active DB connection; skipping cleanup');
    }
    // Close the test server if it was started
    if (global.__TEST_SERVER__) {
      await new Promise((resolve, reject) => {
        global.__TEST_SERVER__.close(err => (err ? reject(err) : resolve()));
      });
      delete global.__TEST_SERVER__;
      console.log('✅ Test server closed');
    }
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});