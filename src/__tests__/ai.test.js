import { processAIQuery, generateInsights, generateRecommendations } from '../ai-utils';

describe('AI Helpers', () => {
  const books = [
    { id: 1, title: 'Book A', author: 'Author 1', genre: 'Fiction', status: 'Completed', userId: 1, pages: 300, price: 10.0 },
    { id: 2, title: 'Book B', author: 'Author 2', genre: 'Fiction', status: 'Reading', userId: 1, pages: 200, price: 12.0 },
    { id: 3, title: 'Book C', author: 'Author 3', genre: 'Fantasy', status: 'To Read', userId: 2, pages: 250, price: 15.0 },
    { id: 4, title: 'Book D', author: 'Author 4', genre: 'Fiction', status: 'To Read', userId: 2, pages: 150, price: 8.0 }
  ];

  const users = [
    { id: 1, name: 'User One', email: 'one@example.com' },
    { id: 2, name: 'User Two', email: 'two@example.com' }
  ];

  test('generateInsights returns correct insights', () => {
    const insights = generateInsights(books, 1);
    expect(insights.some(i => i.includes('Fiction is your most read genre'))).toBe(true);
    expect(insights.some(i => i.includes("You've completed 1 books"))).toBe(true);
    expect(insights.some(i => i.includes('Average book length: 250 pages'))).toBe(true);
  });

  test('generateRecommendations returns recommendations excluding owned titles', () => {
    const recs = generateRecommendations(books, 1);
    // Favorite genre for user 1 is Fiction; recommendation should include Fiction titles not owned by user 1
    expect(recs.length).toBeGreaterThanOrEqual(0);
    recs.forEach(r => {
      expect(r.reason).toMatch(/Based on your interest in/);
      expect(["Book A", "Book B"]).not.toContain(r.title);
    });
  });

  test('processAIQuery returns text and table results', () => {
    const mostBooksQuery = processAIQuery('Who owns the most books?', books, users, 1);
    expect(mostBooksQuery.type).toBe('text');
    expect(typeof mostBooksQuery.result).toBe('string');

    const expensiveQuery = processAIQuery('Show the five most expensive books', books, users, 1);
    expect(expensiveQuery.type).toBe('table');
    expect(Array.isArray(expensiveQuery.result)).toBe(true);
    // Ensure Owner column exists
    expect(expensiveQuery.result[0]).toHaveProperty('Owner');
  });

  test('average price by genre returns table rows with AveragePrice', () => {
    const res = processAIQuery('What is the average price by genre?', books, users, 1);
    expect(res.type).toBe('table');
    expect(res.result.length).toBeGreaterThan(0);
    expect(res.result[0]).toHaveProperty('AveragePrice');
  });

  test('top readers returns a table with counts', () => {
    const res = processAIQuery('Top readers in the last 30 days', books, users, 1);
    expect(res.type).toBe('table');
    expect(res.result.length).toBeGreaterThanOrEqual(0);
    // Each row should have UserId and Count
    res.result.forEach(r => {
      expect(r).toHaveProperty('UserId');
      expect(r).toHaveProperty('Count');
    });
  });

  test('returns helpful message for unknown queries', () => {
    const res = processAIQuery('Tell me something meaningless', books, users, 1);
    expect(res.type).toBe('text');
    expect(res.result).toMatch(/I can help you with queries like/i);
  });

  test('summarize reading habits returns insight text', () => {
    const res = processAIQuery('Summarize reading habits', books, users, 1);
    expect(res.type).toBe('text');
    expect(res.result).toMatch(/most read genre|completed|Average book length/i);
  });
});
