import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  test('renders login page', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Library System/i })).toBeInTheDocument();
  });

  test('shows demo account information', () => {
    render(<App />);
    expect(screen.getByText(/Admin: admin@library.com/)).toBeInTheDocument();
    expect(screen.getByText(/User: john@example.com/)).toBeInTheDocument();
  });

  test('has email and password inputs', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});