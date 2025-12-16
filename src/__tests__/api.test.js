import api, { authAPI, aiAPI, booksAPI } from '../services/api';

describe('API service', () => {
  beforeEach(() => {
    // clear localStorage
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('auth login stores token and user', async () => {
    const fakeUser = { id: 'u1', name: 'Test', email: 't@test' };
    const fakeToken = 'tok-123';
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ token: fakeToken, user: fakeUser }) });

    const res = await authAPI.login('t@test', 'pass');
    expect(res.token).toBe(fakeToken);
    expect(localStorage.getItem('token')).toBe(fakeToken);
    expect(JSON.parse(localStorage.getItem('user')).email).toBe('t@test');
  });

  test('ai query returns result', async () => {
    const sample = { type: 'text', result: 'ok' };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => sample });
    const res = await aiAPI.query('Hello');
    expect(res).toEqual(sample);
  });

  test('books getAll returns array', async () => {
    const books = [{ id: 1, title: 'A' }];
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => books });
    const res = await booksAPI.getAll();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].title).toBe('A');
  });
});
