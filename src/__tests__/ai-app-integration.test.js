import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('App AI integration', () => {
  test('logged in user can query AI and see results', async () => {
    render(<App />);

    // Login with demo user
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@library.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginButton);

    // Navigate to AI Assistant
    const aiButton = await screen.findByRole('button', { name: /AI Assistant/i });
    fireEvent.click(aiButton);

    // Type query and submit
    const aiInput = await screen.findByPlaceholderText(/e.g., Who owns the most books?/i);
    const askButton = screen.getByRole('button', { name: /Ask/i });
    fireEvent.change(aiInput, { target: { value: 'Show the five most expensive books' } });
    fireEvent.click(askButton);

    // Wait for the results to show up
    await waitFor(() => expect(screen.queryByText(/Result:/i)).toBeInTheDocument());
    expect(screen.getByText(/Result:/i)).toBeInTheDocument();
    // Toggle server AI and submit again — since there's no token this will fallback to local and show a message
    const useServerCheck = screen.getByLabelText(/Use server AI/i);
    fireEvent.click(useServerCheck);
    fireEvent.change(aiInput, { target: { value: 'Show the five most expensive books' } });
    fireEvent.click(askButton);
    await waitFor(() => expect(screen.queryByText(/Result:/i)).toBeInTheDocument());
  });

  test('server AI with valid token should be used when toggled on', async () => {
    // Mock server responses for login and AI query
    const fakeToken = 'fake-jwt-token';
    global.fetch = jest.fn((url, opts) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({ ok: true, json: async () => ({ token: fakeToken, user: { id: '1', name: 'Server Admin', email: 'admin@library.com', role: 'admin' } }) });
      }
      if (url === '/api/ai/query') {
        return Promise.resolve({ ok: true, json: async () => ({ type: 'text', result: 'Server AI: top book is The Hobbit' }) });
      }
      // Default harmless response for other endpoints
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<App />);

    // Login
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@library.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginButton);

    // Navigate to AI Assistant
    const aiButton = await screen.findByRole('button', { name: /AI Assistant/i });
    fireEvent.click(aiButton);

    // Toggle server AI
    const useServerCheck = await screen.findByLabelText(/Use server AI/i);
    fireEvent.click(useServerCheck);

    // Type query and submit
    const aiInput = await screen.findByPlaceholderText(/e.g., Who owns the most books?/i);
    const askButton = screen.getByRole('button', { name: /Ask/i });
    fireEvent.change(aiInput, { target: { value: 'Which is the most popular book?' } });
    fireEvent.click(askButton);

    // Wait until at least the login + AI network calls have been made; other
    // incidental calls may happen depending on component behavior
    await waitFor(() => expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2));

    // Ensure the auth and AI endpoints were called
    const urls = global.fetch.mock.calls.map(c => c[0]);
    expect(urls).toEqual(expect.arrayContaining(['/api/auth/login', '/api/ai/query']));

    // Find the AI call and verify it included the Authorization header
    const aiCall = global.fetch.mock.calls.find(c => c[0] === '/api/ai/query');
    expect(aiCall).toBeDefined();
    expect(aiCall[1].headers.Authorization).toBe(`Bearer ${fakeToken}`);

    // Then wait for server result to appear
    await waitFor(() => expect(screen.getByText(/Server AI: top book is The Hobbit/)).toBeInTheDocument());
    // Reset mock
    global.fetch.mockRestore && global.fetch.mockRestore();
  });
});
