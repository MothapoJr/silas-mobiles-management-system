// src/pages/ClientHome.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {getEquipment,getServices, listQuotes, createQuote, listBookings,  createBooking,
  cancelBooking,  getClientProfile,
  updateClientProfile,} from '../services/api';






const TABS = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'profile', label: 'Profile' },
];

export default function ClientHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('catalogue');

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
              Client dashboard
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
      <nav className="border-b border-silas-navy/10 bg-white">
        <div className="mx-auto flex max-w-5xl gap-1 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
        {activeTab === 'catalogue' && <CatalogueSection />}
        {activeTab === 'quotes' && <QuotesSection />}
        {activeTab === 'bookings' && <BookingsSection />}
        {activeTab === 'profile' && <ProfileSection />}

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

/* ─── Section placeholders (filled in later pieces) ─────────────────────── */

function CatalogueSection() {
  const [equipment, setEquipment] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [eqRes, svcRes] = await Promise.all([
          getEquipment(),
          getServices(),
        ]);
        if (cancelled) return;

        // Backend returns { equipment: [...] } / { services: [...] }
        const eqList = Array.isArray(eqRes)
          ? eqRes
          : Array.isArray(eqRes?.equipment)
            ? eqRes.equipment
            : [];
        const svcList = Array.isArray(svcRes)
          ? svcRes
          : Array.isArray(svcRes?.services)
            ? svcRes.services
            : [];

        setEquipment(eqList);
        setServices(svcList);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load catalogue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatMoney(value) {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <SectionCard title="Catalogue">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading catalogue…</p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Equipment */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Equipment
            </h3>
            {equipment.length === 0 ? (
              <p className="text-sm text-silas-ink/50">
                No equipment available right now.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {equipment.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
                  >
                    <p className="font-medium text-silas-navy">
                      {item.name || item.equipmentName || 'Equipment'}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-silas-ink/60 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-silas-navy">
                        {formatMoney(item.dailyRate ?? item.rate)}
                        <span className="font-normal text-silas-ink/50">
                          {' '}
                          / day
                        </span>
                      </span>
                      {item.status && (
                        <span className="rounded-full bg-silas-navy/10 px-2 py-0.5 text-xs text-silas-navy">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Services
            </h3>
            {services.length === 0 ? (
              <p className="text-sm text-silas-ink/50">No services listed.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {services.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
                  >
                    <p className="font-medium text-silas-navy">
                      {item.serviceName || item.name || 'Service'}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-silas-ink/60 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="mt-3 text-sm font-medium text-silas-navy">
                      {formatMoney(item.basePrice)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function QuotesSection() {
  const [quotes, setQuotes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  async function loadQuotes() {
    const res = await listQuotes();
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.quotes)
        ? res.quotes
        : [];
    setQuotes(list);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [quotesRes, svcRes] = await Promise.all([
          listQuotes(),
          getServices(),
        ]);
        if (cancelled) return;

        const list = Array.isArray(quotesRes)
          ? quotesRes
          : Array.isArray(quotesRes?.quotes)
            ? quotesRes.quotes
            : [];
        const svcList = Array.isArray(svcRes)
          ? svcRes
          : Array.isArray(svcRes?.services)
            ? svcRes.services
            : [];

        setQuotes(list);
        setServices(svcList);
        if (svcList.length > 0 && !selectedServiceId) {
          setSelectedServiceId(svcList[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load quotes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatMoney(value) {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `R ${n.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function shortId(id) {
    if (!id) return '—';
    return String(id).slice(-8);
  }

  function statusBadge(status) {
    const map = {
      draft: 'bg-silas-navy/10 text-silas-navy',
      sent: 'bg-amber-100 text-amber-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-700',
    };
    const cls = map[status] || 'bg-silas-navy/10 text-silas-navy';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {status || '—'}
      </span>
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedServiceId) {
      setFormError('Select a service');
      return;
    }
    const qty = Math.max(parseInt(quantity, 10) || 1, 1);

    setSubmitting(true);
    try {
      await createQuote({
        items: [{ serviceId: selectedServiceId, quantity: qty }],
      });
      setFormSuccess('Quote created');
      setQuantity(1);
      await loadQuotes();
    } catch (err) {
      setFormError(err.message || 'Failed to create quote');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="Quotes">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading quotes…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Existing quotes */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Your quotes
            </h3>
            {quotes.length === 0 ? (
              <p className="text-sm text-silas-ink/50">No quotes yet.</p>
            ) : (
              <ul className="space-y-3">
                {quotes.map((q) => (
                  <li
                    key={q.id}
                    className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-silas-navy">
                          Quote …{shortId(q.id)}
                        </p>
                        <p className="mt-0.5 text-sm text-silas-ink/50">
                          {q.quoteDate || (q.createdAt || '').slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(q.status)}
                        <span className="text-sm font-medium text-silas-navy">
                          {formatMoney(q.totalEstimate)}
                        </span>
                      </div>
                    </div>
                    {Array.isArray(q.QuoteItems) && q.QuoteItems.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-silas-navy/5 pt-3 text-sm text-silas-ink/70">
                        {q.QuoteItems.map((item) => (
                          <li key={item.id}>
                            {item.Service?.serviceName || 'Service'} ×{' '}
                            {item.quantity} @ {formatMoney(item.unitPrice)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Create form */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              New quote
            </h3>
            <form
              onSubmit={handleCreate}
              className="space-y-4 rounded-lg border border-silas-navy/10 bg-white p-4"
            >
              <div>
                <label
                  htmlFor="quote-service"
                  className="mb-1 block text-sm font-medium text-silas-navy"
                >
                  Service
                </label>
                <select
                  id="quote-service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-lg border border-silas-navy/20 bg-white px-3 py-2 text-sm text-silas-ink focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                >
                  {services.length === 0 && (
                    <option value="">No services available</option>
                  )}
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceName} — {formatMoney(s.basePrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quote-qty"
                  className="mb-1 block text-sm font-medium text-silas-navy"
                >
                  Quantity
                </label>
                <input
                  id="quote-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full max-w-[8rem] rounded-lg border border-silas-navy/20 bg-white px-3 py-2 text-sm text-silas-ink focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                  {formSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || services.length === 0}
                className="rounded-lg bg-silas-navy px-4 py-2 text-sm font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create quote'}
              </button>
            </form>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Create form
  const [bookingDate, setBookingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadBookings() {
    const res = await listBookings();
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.bookings)
        ? res.bookings
        : [];
    setBookings(list);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bookingsRes, eqRes] = await Promise.all([
          listBookings(),
          getEquipment(),
        ]);
        if (cancelled) return;

        const list = Array.isArray(bookingsRes)
          ? bookingsRes
          : Array.isArray(bookingsRes?.bookings)
            ? bookingsRes.bookings
            : [];
        const eqList = Array.isArray(eqRes)
          ? eqRes
          : Array.isArray(eqRes?.equipment)
            ? eqRes.equipment
            : [];

        setBookings(list);
        setEquipment(eqList);
        if (eqList.length > 0) setEquipmentId(eqList[0].id);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load bookings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatMoney(value) {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return `R ${n.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function shortId(id) {
    if (!id) return '—';
    return String(id).slice(-8);
  }

  function statusBadge(status) {
    const map = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-silas-navy/10 text-silas-navy',
      cancelled: 'bg-red-100 text-red-700',
      disputed: 'bg-red-100 text-red-700',
      expired: 'bg-silas-ink/10 text-silas-ink/60',
    };
    const cls = map[status] || 'bg-silas-navy/10 text-silas-navy';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {status || '—'}
      </span>
    );
  }

  function canCancel(status) {
    return status === 'pending' || status === 'confirmed';
  }

  async function handleCancel(id) {
    setActionError(null);
    setActionSuccess(null);
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setActionSuccess('Booking cancelled');
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Cancel failed');
    } finally {
      setCancellingId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!bookingDate) {
      setActionError('Booking date is required');
      return;
    }
    if (!venue.trim()) {
      setActionError('Venue is required');
      return;
    }
    if (!equipmentId) {
      setActionError('Select equipment (none available right now)');
      return;
    }
    if (!rentalStart || !rentalEnd) {
      setActionError('Rental start and end dates are required');
      return;
    }
    if (rentalEnd < rentalStart) {
      setActionError('Rental end must be on or after start');
      return;
    }

    const qty = Math.max(parseInt(quantity, 10) || 1, 1);
    const body = {
      bookingDate,
      event: {
        venue: venue.trim(),
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
      },
      items: [
        {
          equipmentId,
          quantity: qty,
          rentalStartDate: rentalStart,
          rentalEndDate: rentalEnd,
        },
      ],
    };

    setSubmitting(true);
    try {
      await createBooking(body);
      setActionSuccess('Booking created');
      setVenue('');
      setGuestCount('');
      setQuantity(1);
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="Bookings">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading bookings…</p>
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

      {!loading && !error && (
        <div className="space-y-8">
          {/* List */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Your bookings
            </h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-silas-ink/50">No bookings yet.</p>
            ) : (
              <ul className="space-y-3">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-silas-navy">
                          Booking …{shortId(b.id)}
                        </p>
                        <p className="mt-0.5 text-sm text-silas-ink/50">
                          {b.bookingDate}
                          {b.Event?.venue ? ` · ${b.Event.venue}` : ''}
                          {b.Event?.guestCount != null
                            ? ` · ${b.Event.guestCount} guests`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(b.status)}
                        <span className="text-sm font-medium text-silas-navy">
                          {formatMoney(b.totalCost)}
                        </span>
                      </div>
                    </div>

                    {Array.isArray(b.BookingItems) &&
                      b.BookingItems.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-silas-navy/5 pt-3 text-sm text-silas-ink/70">
                          {b.BookingItems.map((item) => (
                            <li key={item.id}>
                              {item.Equipment?.name || 'Equipment'} ×{' '}
                              {item.quantity} · {item.rentalStartDate} →{' '}
                              {item.rentalEndDate} ·{' '}
                              {formatMoney(item.lineTotal)}
                            </li>
                          ))}
                        </ul>
                      )}

                    {canCancel(b.status) && (
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={cancellingId === b.id}
                          onClick={() => handleCancel(b.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingId === b.id
                            ? 'Cancelling…'
                            : 'Cancel booking'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Create */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              New booking
            </h3>
            {equipment.length === 0 && (
              <p className="mb-3 text-sm text-silas-ink/50">
                No available equipment in the catalogue right now — create will
                fail until an item is marked available.
              </p>
            )}
            <form
              onSubmit={handleCreate}
              className="space-y-4 rounded-lg border border-silas-navy/10 bg-white p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="bk-date"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Booking date
                  </label>
                  <input
                    id="bk-date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bk-venue"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Venue
                  </label>
                  <input
                    id="bk-venue"
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Willow Creek Estate"
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bk-guests"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Guest count (optional)
                  </label>
                  <input
                    id="bk-guests"
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bk-eq"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Equipment
                  </label>
                  <select
                    id="bk-eq"
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  >
                    {equipment.length === 0 && (
                      <option value="">None available</option>
                    )}
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name || eq.equipmentName} —{' '}
                        {formatMoney(eq.dailyRate ?? eq.rate)}/day
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="bk-qty"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Quantity
                  </label>
                  <input
                    id="bk-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full max-w-[8rem] rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bk-start"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Rental start
                  </label>
                  <input
                    id="bk-start"
                    type="date"
                    value={rentalStart}
                    onChange={(e) => setRentalStart(e.target.value)}
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bk-end"
                    className="mb-1 block text-sm font-medium text-silas-navy"
                  >
                    Rental end
                  </label>
                  <input
                    id="bk-end"
                    type="date"
                    value={rentalEnd}
                    onChange={(e) => setRentalEnd(e.target.value)}
                    className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || equipment.length === 0}
                className="rounded-lg bg-silas-navy px-4 py-2 text-sm font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getClientProfile();
        if (cancelled) return;
        const p = res?.profile || res;
        setProfile(p);
        setName(p?.name || '');
        setCompanyName(p?.companyName || '');
        setContactDetails(p?.contactDetails || '');
        setAddress(p?.address || '');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSaving(true);
    try {
      const res = await updateClientProfile({
        name: name.trim(),
        companyName: companyName.trim(),
        contactDetails: contactDetails.trim(),
        address: address.trim(),
      });
      const p = res?.profile || res;
      setProfile(p);
      setFormSuccess('Profile updated');
    } catch (err) {
      setFormError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Profile">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading profile…</p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && profile && (
        <div className="space-y-6">
          {/* Read-only account info */}
          <div className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4 text-sm">
            <p className="text-silas-ink/50">Account</p>
            <p className="mt-1 font-medium text-silas-navy">
              {profile.User?.email || '—'}
            </p>
            <p className="text-silas-ink/60">
              @{profile.User?.username || '—'} · {profile.User?.roleType || 'client'}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="pf-name"
                className="mb-1 block text-sm font-medium text-silas-navy"
              >
                Display name
              </label>
              <input
                id="pf-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
              />
            </div>

            <div>
              <label
                htmlFor="pf-company"
                className="mb-1 block text-sm font-medium text-silas-navy"
              >
                Company name
              </label>
              <input
                id="pf-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
              />
            </div>

            <div>
              <label
                htmlFor="pf-contact"
                className="mb-1 block text-sm font-medium text-silas-navy"
              >
                Contact details
              </label>
              <input
                id="pf-contact"
                type="text"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
              />
            </div>

            <div>
              <label
                htmlFor="pf-address"
                className="mb-1 block text-sm font-medium text-silas-navy"
              >
                Address
              </label>
              <textarea
                id="pf-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-silas-navy px-4 py-2 text-sm font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </div>
      )}
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