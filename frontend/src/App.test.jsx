import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the placeholder heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /management system/i })
    ).toBeInTheDocument();
  });

  it('lists the upcoming dashboards', () => {
    render(<App />);
    expect(screen.getByText(/client dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/administrator dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/staff interface/i)).toBeInTheDocument();
  });
});
