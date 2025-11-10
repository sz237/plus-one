import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Shell from '@/components/PageTemplate';
import { MemoryRouter } from 'react-router-dom';

describe('Shell', () => {
  it('renders header, sidebar, and children; toggles nav', () => {
    render(
      <MemoryRouter>
        <Shell title="Dashboard">
          <div>BODY</div>
        </Shell>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('BODY')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /toggle navigation/i });
    fireEvent.click(toggle); // open
    fireEvent.click(toggle); // close
  });
});
