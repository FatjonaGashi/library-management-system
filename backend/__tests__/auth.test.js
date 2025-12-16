// backend/__tests__/auth.test.js
// Rewritten to avoid duplicated declarations and keep test coverage concise.
process.env.NODE_ENV = 'test';
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Authentication API', () => {
  // Clean database before each test
  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(global.__TEST_SERVER__)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'newuser@example.com', password: 'password' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('newuser@example.com');
    });

    it('rejects duplicate email', async () => {
      await request(global.__TEST_SERVER__)
        .post('/api/auth/register')
        .send({ name: 'User 1', email: 'dup@example.com', password: 'password' });

      const dupRes = await request(global.__TEST_SERVER__)
        .post('/api/auth/register')
        .send({ name: 'User 2', email: 'dup@example.com', password: 'password2' });

      expect(dupRes.status).toBe(400);
      expect(dupRes.body.error).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(global.__TEST_SERVER__)
        .post('/api/auth/register')
        .send({ name: 'Login User', email: 'loginuser@example.com', password: 'password' });
    });

    it('logs in with valid credentials', async () => {
      const res = await request(global.__TEST_SERVER__)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'password' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('loginuser@example.com');
    });

    it('rejects invalid password', async () => {
      const res = await request(global.__TEST_SERVER__)
          .post('/api/auth/login')
          .send({ email: 'loginuser@example.com', password: 'wrong' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid credentials/i);
      });
    });
  });
// End-of-file