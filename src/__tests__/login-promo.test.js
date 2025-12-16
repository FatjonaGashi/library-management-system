import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPromo from '../components/LoginPromo';

describe('LoginPromo', () => {
  test('renders featured books and allows preview and save', () => {
    const mockTry = jest.fn();
    render(<LoginPromo onTryDemo={mockTry} />);

    // Check that sample books are shown
    expect(screen.getByText(/Featured Books/i)).toBeInTheDocument();
    expect(screen.getByText(/The Hobbit/i)).toBeInTheDocument();

    // Preview details
    const preview = screen.getAllByText(/Preview/i)[0];
    fireEvent.click(preview);
    expect(screen.getByText(/Genre:/i)).toBeInTheDocument();

    // Save to wishlist
    const saveBtn = screen.getAllByText(/Save/i)[0];
    fireEvent.click(saveBtn);
    expect(screen.getAllByText(/Saved/i)[0]).toBeInTheDocument();

    // Try demo triggers handler
    fireEvent.click(screen.getByRole('button', { name: /Try Demo Admin/i }));
    expect(mockTry).toHaveBeenCalled();
  });
});
