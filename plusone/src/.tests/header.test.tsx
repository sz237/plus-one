import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';

describe('Header', () => {
  it('renders title and toggles nav', () => {
    const onToggle = jest.fn();
    render(<Header title="Hello" isNavOpen={false} onToggleNav={onToggle} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /toggle navigation/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});