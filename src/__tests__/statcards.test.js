import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('StatCards', () => {
  test('renders stat cards and shows values', async () => {
    render(<App />);

    // Login as admin to see all books
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@library.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(loginButton);

    // Stat card labels should appear
    const totalLabel = await screen.findByText(/Total Books/i);
    expect(totalLabel).toBeInTheDocument();

    const aiLabel = screen.getByText(/AI Insights/i);
    expect(aiLabel).toBeInTheDocument();

    const progressLabel = screen.getByText(/Reading Progress/i);
    expect(progressLabel).toBeInTheDocument();
  });
});
