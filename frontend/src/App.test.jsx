// src/App.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Auth bootstrap calls refresh/me on mount — stub fetch so tests stay offline.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve(''),
      })
    )
  );
});

describe('App', () => {
  it('renders the home heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /management system/i })
    ).toBeInTheDocument();
  });

  it('shows a Sign in link when logged out', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});