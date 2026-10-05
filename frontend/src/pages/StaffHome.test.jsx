// src/pages/StaffHome.test.jsx
// Focused tests for the Staff dashboard (T19). API + auth are mocked.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StaffHome from './StaffHome';
import * as api from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'staff@silasmobiles.local', roleType: 'staff' },
    logout: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  staffListAssignments: vi.fn(),
  staffUpdateAssignmentStatus: vi.fn(),
  staffReportIssue: vi.fn(),
  staffGetProfile: vi.fn(),
  staffUpdateProfile: vi.fn(),
  staffUpdateAvailability: vi.fn(),
}));

function makeAssignment(overrides = {}) {
  return {
    id: 'a-0000000406',
    status: 'assigned',
    assignedAt: '2026-11-13T08:00:00.000Z',
    Booking: {
      bookingDate: '2026-11-14',
      Event: { venue: 'Willow Creek Estate', guestCount: 120 },
      BookingItems: [
        {
          id: 'bi-1',
          quantity: 1,
          rentalStartDate: '2026-11-14',
          rentalEndDate: '2026-11-16',
          Equipment: { id: 'eq-tent', name: '6x12m Marquee Tent', status: 'reserved' },
        },
        {
          id: 'bi-2',
          quantity: 2,
          rentalStartDate: '2026-11-14',
          rentalEndDate: '2026-11-16',
          Equipment: { id: 'eq-gen', name: 'Generator', status: 'maintenance' },
        },
      ],
    },
    ...overrides,
  };
}

function makeProfile(overrides = {}) {
  return {
    jobRole: 'Driver',
    vehicleLicense: 'Code 10',
    availability: 'available',
    User: {
      email: 'staff@silasmobiles.local',
      username: 'staff',
      roleType: 'staff',
    },
    ...overrides,
  };
}

function renderStaff() {
  return render(
    <MemoryRouter>
      <StaffHome />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  api.staffListAssignments.mockResolvedValue({ assignments: [makeAssignment()] });
  api.staffGetProfile.mockResolvedValue({ profile: makeProfile() });
});

afterEach(() => {
  cleanup();
});

describe('StaffHome - assignments', () => {
  it('renders the tabs and loads assignments', async () => {
    renderStaff();

    expect(screen.getByRole('button', { name: 'Assignments' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Issues' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeTruthy();

    expect(await screen.findByText(/Willow Creek Estate/)).toBeTruthy();
    expect(screen.getByText(/6x12m Marquee Tent/)).toBeTruthy();
    expect(api.staffListAssignments).toHaveBeenCalledWith(undefined);
  });

  it('asks for confirmation before completing, and can go back', async () => {
    renderStaff();
    await screen.findByText(/Willow Creek Estate/);

    fireEvent.click(screen.getByRole('button', { name: 'Mark completed' }));
    expect(screen.getByText(/mark this assignment as completed/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'No, go back' }));
    expect(api.staffUpdateAssignmentStatus).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Mark completed' })).toBeTruthy();
  });

  it('updates the assignment status after confirming', async () => {
    api.staffUpdateAssignmentStatus.mockResolvedValue({ assignment: {} });
    renderStaff();
    await screen.findByText(/Willow Creek Estate/);

    fireEvent.click(screen.getByRole('button', { name: 'Mark completed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, confirm' }));

    await waitFor(() =>
      expect(api.staffUpdateAssignmentStatus).toHaveBeenCalledWith(
        'a-0000000406',
        'completed'
      )
    );
    expect(await screen.findByText('Assignment completed')).toBeTruthy();
  });

  it('shows no action buttons on a completed assignment', async () => {
    api.staffListAssignments.mockResolvedValue({
      assignments: [makeAssignment({ status: 'completed' })],
    });
    renderStaff();
    await screen.findByText(/Willow Creek Estate/);

    expect(screen.queryByRole('button', { name: 'Mark completed' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel assignment' })).toBeNull();
  });
});

describe('StaffHome - issues', () => {
  it('reports an issue and disables items already in maintenance', async () => {
    api.staffReportIssue.mockResolvedValue({ equipment: {} });
    renderStaff();

    fireEvent.click(screen.getByRole('button', { name: 'Issues' }));
    await screen.findByText('6x12m Marquee Tent');

    const reportButtons = await screen.findAllByRole('button', {
      name: 'Report issue',
    });
    // First = Marquee Tent (reserved), second = Generator (maintenance)
    expect(reportButtons[0].disabled).toBe(false);
    expect(reportButtons[1].disabled).toBe(true);

    fireEvent.click(reportButtons[0]);
    fireEvent.change(screen.getByLabelText(/what is wrong/i), {
      target: { value: 'Broken pole' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() =>
      expect(api.staffReportIssue).toHaveBeenCalledWith('eq-tent', 'Broken pole')
    );
    expect(await screen.findByText(/moved to maintenance/i)).toBeTruthy();
  });
});

describe('StaffHome - profile', () => {
  it('loads the profile and changes availability', async () => {
    api.staffUpdateAvailability.mockResolvedValue({
      profile: makeProfile({ availability: 'on_leave' }),
    });
    renderStaff();

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    expect(await screen.findByText('staff@silasmobiles.local')).toBeTruthy();
    expect(screen.getByLabelText('Job role').value).toBe('Driver');

    fireEvent.click(screen.getByRole('button', { name: 'On leave' }));

    await waitFor(() =>
      expect(api.staffUpdateAvailability).toHaveBeenCalledWith('on_leave')
    );
    expect(await screen.findByText('Availability updated')).toBeTruthy();
  });

  it('blocks saving an empty job role', async () => {
    renderStaff();

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    await screen.findByLabelText('Job role');

    fireEvent.change(screen.getByLabelText('Job role'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    expect(await screen.findByText('Job role is required')).toBeTruthy();
    expect(api.staffUpdateProfile).not.toHaveBeenCalled();
  });
});