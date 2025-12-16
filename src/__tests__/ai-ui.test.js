import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AIQuery from '../components/AIQuery';

describe('AIQuery component', () => {
  test('calls handleAIQuery on button click', () => {
    const handleAIQuery = jest.fn();
    render(<AIQuery aiQuery="" setAiQuery={() => {}} handleAIQuery={handleAIQuery} aiResponse={null} users={[]} books={[]} useServerAI={false} setUseServerAI={() => {}} />);

    const askButton = screen.getByRole('button', { name: /Ask/i });
    fireEvent.click(askButton);
    expect(handleAIQuery).toHaveBeenCalled();
  });

  test('calls handleAIQuery on Enter', () => {
    const handleAIQuery = jest.fn();
    const setAiQuery = jest.fn();
    render(<AIQuery aiQuery="test" setAiQuery={setAiQuery} handleAIQuery={handleAIQuery} aiResponse={null} users={[]} books={[]} useServerAI={false} setUseServerAI={() => {}} />);

    const input = screen.getByPlaceholderText(/e.g., Who owns the most books?/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(handleAIQuery).toHaveBeenCalled();
  });

  test('toggle useServerAI calls setUseServerAI', () => {
    const handleAIQuery = jest.fn();
    const setUseServerAI = jest.fn();
    render(<AIQuery aiQuery="" setAiQuery={() => {}} handleAIQuery={handleAIQuery} aiResponse={null} users={[]} books={[]} useServerAI={false} setUseServerAI={setUseServerAI} />);

    const checkbox = screen.getByLabelText(/Use server AI/i);
    fireEvent.click(checkbox);
    expect(setUseServerAI).toHaveBeenCalled();
  });
});
