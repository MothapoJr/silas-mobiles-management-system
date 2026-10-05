// src/pages/AdminHome.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  adminListBookings,
  adminApproveBooking,
  adminRejectBooking,
   adminListEquipment,
  adminUpdateEquipment,
  adminListServices,
  adminUpdateService,
} from '../services/api';


 

const TABS = [
  { id: 'bookings', label: 'Bookings' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'services', label: 'Services' },
];

export default function AdminHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <div className="min-h-screen bg-silas-cream">
      <header className="border-b border-silas-navy/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-silas-navy text-xs font-semibold text-silas-gold">
              S
            </span>
            <span className="text-sm font-medium text-silas-navy">
              Administrator dashboard
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {activeTab === 'bookings' && <BookingsSection />}
        {activeTab === 'equipment' && <EquipmentSection />}
        {activeTab === 'services' && <ServicesSection />}

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

function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load(status) {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListBookings(status || undefined);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.bookings)
          ? res.bookings
          : [];
      setBookings(list);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(statusFilter === 'all' ? '' : statusFilter);
  }, [statusFilter]);

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

  async function handleApprove(id) {
    setActionError(null);
    setActionSuccess(null);
    setBusyId(id);
    try {
      await adminApproveBooking(id);
      setActionSuccess('Booking approved');
      await load(statusFilter === 'all' ? '' : statusFilter);
    } catch (err) {
      setActionError(err.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    setActionError(null);
    setActionSuccess(null);
    setBusyId(id);
    try {
      await adminRejectBooking(id);
      setActionSuccess('Booking rejected');
      await load(statusFilter === 'all' ? '' : statusFilter);
    } catch (err) {
      setActionError(err.message || 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  const FILTERS = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'all', label: 'All' },
  ];

  return (
    <SectionCard title="Bookings">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
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

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-silas-ink/50">No bookings in this filter.</p>
      )}

      {!loading && !error && bookings.length > 0 && (
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
                  <p className="mt-0.5 text-sm text-silas-ink/50">
                    {b.Client?.name || b.Client?.companyName || 'Client'}
                    {b.Client?.User?.email
                      ? ` · ${b.Client.User.email}`
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

              {Array.isArray(b.BookingItems) && b.BookingItems.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-silas-navy/5 pt-3 text-sm text-silas-ink/70">
                  {b.BookingItems.map((item) => (
                    <li key={item.id}>
                      {item.Equipment?.name || 'Equipment'} × {item.quantity} ·{' '}
                      {item.rentalStartDate} → {item.rentalEndDate} ·{' '}
                      {formatMoney(item.lineTotal)}
                    </li>
                  ))}
                </ul>
              )}

              {b.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => handleApprove(b.id)}
                    className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                  >
                    {busyId === b.id ? 'Working…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => handleReject(b.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function EquipmentSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const STATUSES = [
    'available',
    'reserved',
    'active_deployment',
    'maintenance',
    'retired',
  ];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListEquipment();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.equipment)
          ? res.equipment
          : [];
      setItems(list);
    } catch (err) {
      setError(err.message || 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  function statusBadge(status) {
    const map = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-amber-100 text-amber-800',
      active_deployment: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      retired: 'bg-silas-ink/10 text-silas-ink/60',
    };
    const cls = map[status] || 'bg-silas-navy/10 text-silas-navy';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {status || '—'}
      </span>
    );
  }

  async function handleStatusChange(id, status) {
    setActionMsg(null);
    setBusyId(id);
    try {
      await adminUpdateEquipment(id, { status });
      setActionMsg(`Status updated to ${status}`);
      await load();
    } catch (err) {
      setActionMsg(err.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SectionCard title="Equipment">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading equipment…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {actionMsg && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {actionMsg}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-silas-ink/50">No equipment found.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((eq) => (
            <li
              key={eq.id}
              className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-silas-navy">{eq.name}</p>
                  <p className="mt-0.5 text-sm text-silas-ink/50">
                    {eq.EquipmentCategory?.categoryName || 'Uncategorised'}
                    {eq.description ? ` · ${eq.description}` : ''}
                  </p>
                  <p className="mt-1 text-sm font-medium text-silas-navy">
                    {formatMoney(eq.dailyRate)} / day
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {statusBadge(eq.status)}
                  <select
                    value={eq.status || 'available'}
                    disabled={busyId === eq.id}
                    onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                    className="rounded-lg border border-silas-navy/20 bg-white px-2 py-1 text-xs text-silas-navy focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListServices();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.services)
          ? res.services
          : [];
      setServices(list);
    } catch (err) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  function startEdit(svc) {
    setEditingId(svc.id);
    setEditName(svc.serviceName || '');
    setEditDescription(svc.description || '');
    setEditPrice(String(svc.basePrice ?? ''));
    setActionMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditPrice('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setActionMsg(null);
    try {
      await adminUpdateService(editingId, {
        serviceName: editName.trim(),
        description: editDescription.trim() || null,
        basePrice: Number(editPrice),
      });
      setActionMsg('Service updated');
      cancelEdit();
      await load();
    } catch (err) {
      setActionMsg(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Services">
      {loading && (
        <p className="text-sm text-silas-ink/60">Loading services…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {actionMsg && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {actionMsg}
        </p>
      )}

      {!loading && !error && services.length === 0 && (
        <p className="text-sm text-silas-ink/50">No services found.</p>
      )}

      {!loading && !error && services.length > 0 && (
        <ul className="space-y-3">
          {services.map((svc) => (
            <li
              key={svc.id}
              className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
            >
              {editingId === svc.id ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-silas-navy">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-silas-navy">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-silas-navy">
                      Base price (R)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full max-w-[10rem] rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs text-silas-navy hover:bg-silas-navy/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-silas-navy">
                      {svc.serviceName}
                    </p>
                    {svc.description && (
                      <p className="mt-0.5 text-sm text-silas-ink/50">
                        {svc.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-medium text-silas-navy">
                      {formatMoney(svc.basePrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(svc)}
                    className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs font-medium text-silas-navy hover:bg-silas-navy/5"
                  >
                    Edit
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
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