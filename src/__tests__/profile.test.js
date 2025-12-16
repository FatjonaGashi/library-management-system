import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from '../components/Profile';

describe('Profile component', () => {
  test('renders current user info and calls update handler', async () => {
    const mockUser = { id: 2, name: 'Jane Doe', email: 'jane@example.com' };
    const mockUpdate = jest.fn().mockResolvedValueOnce({});
    const mockLogout = jest.fn();
    const mockSetView = jest.fn();

    render(<Profile currentUser={mockUser} handleUpdateProfile={mockUpdate} handleLogout={mockLogout} setView={mockSetView} />);

    // Inputs prefilled
    expect(screen.getByDisplayValue(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/jane@example.com/i)).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue(/Jane Doe/i), { target: { value: 'Jane Updated' } });
    fireEvent.change(screen.getByDisplayValue(/jane@example.com/i), { target: { value: 'jane.updated@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane Updated', email: 'jane.updated@example.com' }));
  });
});
