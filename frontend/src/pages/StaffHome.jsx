// src/pages/StaffHome.jsx
// Staff dashboard (T19). Same layout as ClientHome / AdminHome.
// Tabs: Assignments | Issues | Profile.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffListAssignments } from '../services/api';

const TABS = [
  { id: 'assignments', label: 'Assignments' },
  { id: 'issues', label: 'Issues' },
  { id: 'profile', label: 'Profile' },
];

export default function StaffHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');

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
              Staff dashboard
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
        aria-label="Staff navigation"
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
        {activeTab === 'assignments' && <AssignmentsSection />}
        {activeTab === 'issues' && <IssuesSection />}
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

/* --- Assignments (T19 slice 4: list + filter) ---------------------------- */

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function AssignmentsSection() {
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await staffListAssignments(
          statusFilter === 'all' ? undefined : statusFilter
        );
        if (cancelled) return;
        // Backend returns { assignments: [...] }
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.assignments)
            ? res.assignments
            : [];
        setAssignments(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load assignments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  function shortId(id) {
    if (!id) return '—';
    return String(id).slice(-8);
  }

  function formatDate(value) {
    if (!value) return '—';
    return String(value).slice(0, 10);
  }

  function statusBadge(status) {
    const map = {
      assigned: 'bg-amber-100 text-amber-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-700',
    };
    const cls = map[status] || 'bg-silas-navy/10 text-silas-navy';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {status || '—'}
      </span>
    );
  }

  return (
    <SectionCard title="Assignments">
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
        <p className="text-sm text-silas-ink/60">Loading assignments…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && assignments.length === 0 && (
        <p className="text-sm text-silas-ink/50">
          No assignments in this filter.
        </p>
      )}

      {!loading && !error && assignments.length > 0 && (
        <ul className="space-y-3">
          {assignments.map((a) => {
            const booking = a.Booking;
            const items = Array.isArray(booking?.BookingItems)
              ? booking.BookingItems
              : [];
            return (
              <li
                key={a.id}
                className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-silas-navy">
                      Assignment …{shortId(a.id)}
                    </p>
                    <p className="mt-0.5 text-sm text-silas-ink/50">
                      {booking?.Event?.venue || 'Venue TBC'}
                      {booking?.Event?.guestCount != null
                        ? ` · ${booking.Event.guestCount} guests`
                        : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-silas-ink/50">
                      Event date: {formatDate(booking?.bookingDate)} · Assigned:{' '}
                      {formatDate(a.assignedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(a.status)}
                  </div>
                </div>

                {items.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-silas-navy/5 pt-3 text-sm text-silas-ink/70">
                    {items.map((item) => (
                      <li key={item.id}>
                        {item.Equipment?.name || 'Equipment'} × {item.quantity}{' '}
                        · {formatDate(item.rentalStartDate)} →{' '}
                        {formatDate(item.rentalEndDate)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* --- Placeholders (filled in by later T19 slices) ------------------------ */

function IssuesSection() {
  return (
    <SectionCard title="Report an issue">
      <p className="text-sm text-silas-ink/60">
        Report faulty equipment from your assignments here.
      </p>
    </SectionCard>
  );
}

function ProfileSection() {
  return (
    <SectionCard title="Profile">
      <p className="text-sm text-silas-ink/60">
        Your details and availability will appear here.
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