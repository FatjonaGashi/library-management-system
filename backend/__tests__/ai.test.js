const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
const app = require('../server');

// Use request(app) on-demand to avoid persistent sockets

describe('AI API Endpoints', () => {
  let token;

  beforeEach(async () => {
    // Clean DB
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    // Register user and obtain token
    const res = await request(global.__TEST_SERVER__)
      .post('/api/auth/register')
      .send({ name: 'AI Tester', email: 'aitester@example.com', password: 'password123' });
    token = res.body.token;

    // Add some books for the user
    await request(app).post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A Book', author: 'Author A', genre: 'Fiction', status: 'Completed', pages: 200, price: 10.0 });

    await request(app).post('/api/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'B Book', author: 'Author B', genre: 'Fantasy', status: 'Reading', pages: 350, price: 15.0 });
  });

  test('GET /api/ai/insights returns insights for user', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/ai/insights').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('insights');
    expect(Array.isArray(res.body.insights)).toBe(true);
    expect(res.body.insights.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/ai/recommendations returns recommendations array', async () => {
    const res = await request(global.__TEST_SERVER__).get('/api/ai/recommendations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  test('POST /api/ai/query returns expected structure', async () => {
    const res = await request(global.__TEST_SERVER__)
      .post('/api/ai/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'Show the five most expensive books' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('type');
    expect(res.body).toHaveProperty('result');
  });
});

// No agent.close needed when using request(app) as it doesn't maintain persistent sockets
