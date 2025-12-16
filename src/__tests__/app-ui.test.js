import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App UI validation behavior', () => {
  test('form validation and Add Book enable/disable behavior', async () => {
    render(<App />);
    // Register a new user first so we can access dashboard
    fireEvent.click(screen.getByText(/Don't have an account\? Register/i));
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Tester' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'tester@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    // Click on My Books and then Add Book (wait for nav buttons to render)
    const myBooksBtn = await screen.findByRole('button', { name: /My Books/i });
    fireEvent.click(myBooksBtn);
    const addBookBtn = await screen.findByRole('button', { name: /Add Book/i });
    fireEvent.click(addBookBtn);

    // Wait for the Add Book form to render and scope queries to it
    const formHeader = await screen.findByText(/Add New Book/i);
    const { getByRole } = require('@testing-library/react');
    // find the submit button within the form container
    const submitBtn = screen.getAllByRole('button', { name: /Add Book/i }).find(b => b !== addBookBtn) || formHeader.parentElement.querySelector('button');
    expect(submitBtn).toBeDisabled();

    // Fill required fields then the button should enable
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'New Book' } });
    fireEvent.change(screen.getByPlaceholderText('Author'), { target: { value: 'Test Author' } });
    expect(submitBtn).not.toBeDisabled();
  });
});
