// src/pages/FinanceHome.test.jsx
// Focused tests for the Finance dashboard. API + auth are mocked.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FinanceHome from './FinanceHome';
import * as api from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'finance@silasmobiles.local', roleType: 'finance_officer' },
    logout: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  financeListInvoices: vi.fn(),
  financeMarkInvoicePayment: vi.fn(),
  financeCreateInvoice: vi.fn(),
  financeGetSummary: vi.fn(),
}));

function makeInvoice(overrides = {}) {
  return {
    id: 'inv-0000000405',
    amount: 14700,
    paymentStatus: 'partial',
    paymentMethod: 'EFT',
    issueDate: '2026-10-20',
    dueDate: '2026-11-07',
    Booking: {
      id: 'bk-0000000401',
      Client: { User: { email: 'client@silasmobiles.local' } },
    },
    ...overrides,
  };
}

function makeSummary(overrides = {}) {
  return {
    byStatus: {
      unpaid: { count: 0, totalAmount: 0 },
      partial: { count: 1, totalAmount: 14700 },
      paid: { count: 3, totalAmount: 44100 },
    },
    overall: { count: 4, totalAmount: 58800 },
    ...overrides,
  };
}

function renderFinance() {
  return render(
    <MemoryRouter>
      <FinanceHome />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  api.financeListInvoices.mockResolvedValue([makeInvoice()]);
  api.financeGetSummary.mockResolvedValue(makeSummary());
});

afterEach(() => {
  cleanup();
});

describe('FinanceHome - shell', () => {
  it('renders the three tabs', () => {
    renderFinance();
    expect(screen.getByRole('button', { name: 'Invoices' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Summary' })).toBeTruthy();
  });
});

describe('FinanceHome - invoices', () => {
  it('loads and shows invoices on the default tab', async () => {
    renderFinance();
    expect(await screen.findByText(/Invoice …00000405/)).toBeTruthy();
    expect(screen.getByText(/client@silasmobiles.local/)).toBeTruthy();
    expect(screen.getByText('partial')).toBeTruthy();
    expect(api.financeListInvoices).toHaveBeenCalled();
  });

  it('filters by unpaid and shows empty state', async () => {
    api.financeListInvoices.mockResolvedValue([]);
    renderFinance();
    await screen.findByText(/No invoices in this filter|Loading/i);

    fireEvent.click(screen.getByRole('button', { name: 'Unpaid' }));
    expect(await screen.findByText(/No invoices in this filter/)).toBeTruthy();
    expect(api.financeListInvoices).toHaveBeenCalledWith('unpaid');
  });
});

describe('FinanceHome - create', () => {
  it('requires a booking ID before create', async () => {
    renderFinance();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: /Create invoice/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Create invoice' }));
    expect(await screen.findByText(/Booking ID is required/i)).toBeTruthy();
    expect(api.financeCreateInvoice).not.toHaveBeenCalled();
  });

  it('submits a standard invoice when booking ID is set', async () => {
    api.financeCreateInvoice.mockResolvedValue({
      id: 'inv-new-1',
      type: 'standard',
      amount: 14700,
      paymentStatus: 'unpaid',
    });
    renderFinance();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByRole('heading', { name: /Create invoice/i });

    fireEvent.change(screen.getByLabelText(/Booking ID/i), {
      target: { value: 'bk-0000000401' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create invoice' }));

    await waitFor(() =>
      expect(api.financeCreateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'bk-0000000401',
          type: 'standard',
        })
      )
    );
    expect(await screen.findByText(/Created invoice/i)).toBeTruthy();
  });
});

describe('FinanceHome - summary', () => {
  it('shows counts and totals from totalAmount', async () => {
    renderFinance();
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }));

    expect(await screen.findByText(/1 invoice/)).toBeTruthy();
    expect(screen.getByText(/3 invoices/)).toBeTruthy();
    expect(screen.getByText(/4 invoices/)).toBeTruthy();
    // en-ZA style amounts
    expect(screen.getAllByText(/R 14\s?700/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R 44\s?100/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R 58\s?800/).length).toBeGreaterThan(0);
    expect(api.financeGetSummary).toHaveBeenCalled();
  });
});

