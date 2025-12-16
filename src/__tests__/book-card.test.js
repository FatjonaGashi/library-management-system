import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

test('book cards render and action buttons are present in the DOM', async () => {
  // Prevent JSDOM alert errors
  window.alert = jest.fn();

  render(<App />);
  // login as admin demo to see owner info and actions
  const emailInput = screen.getByPlaceholderText(/Email/i);
  const passwordInput = screen.getByPlaceholderText(/Password/i);
  const loginButton = screen.getByRole('button', { name: /Login/i });

  fireEvent.change(emailInput, { target: { value: 'admin@library.com' } });
  fireEvent.change(passwordInput, { target: { value: 'admin123' } });
  fireEvent.click(loginButton);

  // Ensure at least one book title is present on the dashboard
  const bookTitles = await screen.findAllByText(/1984|The Hobbit|Sapiens/);
  expect(bookTitles.length).toBeGreaterThanOrEqual(1);

  // The action buttons (edit/delete) are rendered as buttons with svg children
  const svgButtons = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('svg'));
  expect(svgButtons.length).toBeGreaterThanOrEqual(2);
});
