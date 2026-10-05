// src/pages/FinanceHome.jsx
// Finance dashboard. Same layout as ClientHome / AdminHome / StaffHome.
// Tabs: Invoices | Create | Summary.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  financeListInvoices,
  financeMarkInvoicePayment,
} from '../services/api';

const TABS = [
  { id: 'invoices', label: 'Invoices' },
  { id: 'create', label: 'Create' },
  { id: 'summary', label: 'Summary' },
];

export default function FinanceHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices');

  return (
    <div className="min-h-screen bg-silas-cream">
      {/* Header */}
      <header className="border-b border-silas-navy/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-silas-navy text-xs font-semibold text-silas-gold">
              S
            </span>
            <span className="text-sm font-medium text-silas-navy">
              Finance dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-silas-ink/50 sm:inline">
              {user?.email || user?.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-sm text-silas-navy hover:bg-silas-navy/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav
        aria-label="Finance navigation"
        className="border-b border-silas-navy/10 bg-white"
      >
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-silas-gold text-silas-navy'
                  : 'border-transparent text-silas-ink/50 hover:text-silas-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {activeTab === 'invoices' && <InvoicesSection />}
        {activeTab === 'create' && <CreateSection />}
        {activeTab === 'summary' && <SummarySection />}

        <Link
          to="/"
          className="mt-10 inline-block text-sm text-silas-navy hover:underline"
        >
          ← Home
        </Link>
      </main>
    </div>
  );
}

/* --- Invoices (slices 3-4: list, filter, record payment) ----------------- */

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

function InvoicesSection() {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Record-payment UI state
  const [editing, setEditing] = useState(null); // { id, status, method, confirming }
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await financeListInvoices(
          statusFilter === 'all' ? undefined : statusFilter
        );
        if (cancelled) return;
        // Backend returns a plain array
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.invoices)
            ? res.invoices
            : [];
        setInvoices(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load invoices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, reloadKey]);

  function formatMoney(value) {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `R ${n.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    return String(value).slice(0, 10);
  }

  function shortId(id) {
    if (!id) return '—';
    return String(id).slice(-8);
  }

  function statusBadge(status) {
    const map = {
      unpaid: 'bg-red-100 text-red-700',
      partial: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
    };
    const cls = map[status] || 'bg-silas-navy/10 text-silas-navy';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {status || '—'}
      </span>
    );
  }

  function changeFilter(value) {
    setStatusFilter(value);
    setEditing(null);
    setActionError(null);
    setActionSuccess(null);
  }

  function startEdit(inv) {
    setActionError(null);
    setActionSuccess(null);
    setEditing({
      id: inv.id,
      status: inv.paymentStatus,
      method: inv.paymentMethod || '',
      confirming: false,
    });
  }

  async function save(inv, confirmed) {
    if (!editing) return;
    const statusChanged = editing.status !== inv.paymentStatus;

    // Closing an invoice as paid needs an explicit second step
    if (editing.status === 'paid' && statusChanged && !confirmed) {
      setEditing((e) => ({ ...e, confirming: true }));
      return;
    }

    const method = editing.method.trim();
    setBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await financeMarkInvoicePayment(
        inv.id,
        editing.status,
        method || undefined
      );
      setActionSuccess(`Invoice …${shortId(inv.id)} updated`);
      setEditing(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message || 'Payment update failed');
      setEditing((e) => (e ? { ...e, confirming: false } : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Invoices">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => changeFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === f.value
                ? 'bg-silas-navy text-white'
                : 'bg-silas-navy/10 text-silas-navy hover:bg-silas-navy/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-silas-ink/60">Loading invoices…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {(actionError || actionSuccess) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            actionError
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-800'
          }`}
        >
          {actionError || actionSuccess}
        </p>
      )}

      {!loading && !error && invoices.length === 0 && (
        <p className="text-sm text-silas-ink/50">
          No invoices in this filter.
        </p>
      )}

      {!loading && !error && invoices.length > 0 && (
        <ul className="space-y-3">
          {invoices.map((inv) => {
            const isEditing = editing?.id === inv.id;
            const methodChanged =
              isEditing &&
              editing.method.trim() !== (inv.paymentMethod || '');
            const hasChange =
              isEditing &&
              (editing.status !== inv.paymentStatus || methodChanged);

            return (
              <li
                key={inv.id}
                className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-silas-navy">
                      Invoice …{shortId(inv.id)}
                    </p>
                    <p className="mt-0.5 text-sm text-silas-ink/50">
                      {inv.Booking?.Client?.User?.email || 'Client'}
                      {inv.Booking?.id
                        ? ` · Booking …${shortId(inv.Booking.id)}`
                        : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-silas-ink/50">
                      Issued: {formatDate(inv.issueDate)} · Due:{' '}
                      {formatDate(inv.dueDate)}
                      {inv.paymentMethod ? ` · ${inv.paymentMethod}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(inv.paymentStatus)}
                    <span className="text-sm font-medium text-silas-navy">
                      {formatMoney(inv.amount)}
                    </span>
                  </div>
                </div>

                {!isEditing && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => startEdit(inv)}
                      className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs font-medium text-silas-navy hover:bg-silas-navy/5"
                    >
                      Record payment
                    </button>
                  </div>
                )}

                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      save(inv, false);
                    }}
                    className="mt-3 space-y-3 rounded-lg border border-silas-navy/10 bg-white p-3"
                  >
                    <div>
                      <p className="mb-1 text-xs font-medium text-silas-navy">
                        Payment status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={busy}
                            aria-pressed={editing.status === s.value}
                            onClick={() =>
                              setEditing((e) => ({
                                ...e,
                                status: s.value,
                                confirming: false,
                              }))
                            }
                            className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                              editing.status === s.value
                                ? 'bg-silas-navy text-white'
                                : 'bg-silas-navy/10 text-silas-navy hover:bg-silas-navy/20'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`pay-method-${inv.id}`}
                        className="mb-1 block text-xs font-medium text-silas-navy"
                      >
                        Payment method (optional)
                      </label>
                      <input
                        id={`pay-method-${inv.id}`}
                        type="text"
                        list={`pay-method-options-${inv.id}`}
                        maxLength={50}
                        value={editing.method}
                        onChange={(e) =>
                          setEditing((cur) => ({
                            ...cur,
                            method: e.target.value,
                          }))
                        }
                        placeholder="e.g. EFT"
                        className="w-full max-w-xs rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                      />
                      <datalist id={`pay-method-options-${inv.id}`}>
                        <option value="EFT" />
                        <option value="Card" />
                        <option value="Cash" />
                      </datalist>
                    </div>

                    {editing.confirming ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-sm text-amber-900">
                          Mark this invoice ({formatMoney(inv.amount)}) as fully
                          paid?
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => save(inv, true)}
                            className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                          >
                            {busy ? 'Working…' : 'Yes, mark as paid'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setEditing((e) => ({ ...e, confirming: false }))
                            }
                            className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
                          >
                            No, go back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={busy || !hasChange}
                          className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                        >
                          {busy ? 'Saving…' : 'Save payment'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing(null)}
                          className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* --- Placeholders (filled in by later slices) ---------------------------- */

function CreateSection() {
  return (
    <SectionCard title="Create invoice">
      <p className="text-sm text-silas-ink/60">
        Invoice creation will appear here.
      </p>
    </SectionCard>
  );
}

function SummarySection() {
  return (
    <SectionCard title="Summary">
      <p className="text-sm text-silas-ink/60">
        Payment totals will appear here.
      </p>
    </SectionCard>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-silas-navy/10 bg-white p-6 shadow-sm">
      <h2
        className="mb-4 text-xl font-semibold text-silas-navy"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}