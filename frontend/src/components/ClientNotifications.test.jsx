// src/components/ClientNotifications.test.jsx
// API is mocked; no network.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ClientNotifications from './ClientNotifications';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const BOOKING_ID = '00000000-0000-4000-8000-000000000401';

function makeNotification(overrides = {}) {
  return {
    id: 'n-1',
    type: 'booking.confirmed',
    status: 'sent',
    message: `Your booking ${BOOKING_ID} has been confirmed.`,
    createdAt: '2026-11-02T09:30:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('ClientNotifications', () => {
  it('shows the full booking id, a label and the New chip for unread items', async () => {
    api.listNotifications.mockResolvedValue([makeNotification()]);
    render(<ClientNotifications />);

    expect(await screen.findByText(new RegExp(BOOKING_ID))).toBeTruthy();
    expect(screen.getByText('Booking confirmed')).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mark as read' })).toBeTruthy();
  });

  it('accepts the { notifications } response shape', async () => {
    api.listNotifications.mockResolvedValue({
      notifications: [makeNotification({ status: 'read' })],
    });
    render(<ClientNotifications />);

    expect(await screen.findByText(new RegExp(BOOKING_ID))).toBeTruthy();
    expect(screen.queryByText('New')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mark as read' })).toBeNull();
  });

  it('marks one notification as read and tells the parent', async () => {
    api.listNotifications.mockResolvedValue([makeNotification()]);
    api.markNotificationRead.mockResolvedValue({});
    const onChange = vi.fn();
    render(<ClientNotifications onChange={onChange} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Mark as read' }));

    await waitFor(() =>
      expect(api.markNotificationRead).toHaveBeenCalledWith('n-1')
    );
    await waitFor(() => expect(screen.queryByText('New')).toBeNull());
    expect(onChange).toHaveBeenCalled();
  });

  it('shows an empty state when there are none', async () => {
    api.listNotifications.mockResolvedValue([]);
    render(<ClientNotifications />);

    expect(await screen.findByText(/No notifications yet/i)).toBeTruthy();
  });

  it('shows an error when loading fails', async () => {
    api.listNotifications.mockRejectedValue(new Error('Boom'));
    render(<ClientNotifications />);

    expect(await screen.findByText('Boom')).toBeTruthy();
  });
});