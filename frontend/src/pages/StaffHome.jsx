// src/pages/StaffHome.jsx
// Staff dashboard (T19). Same layout as ClientHome / AdminHome.
// Tabs: Assignments | Issues | Profile.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  staffListAssignments,
  staffUpdateAssignmentStatus,
  staffReportIssue,
  staffGetProfile,
  staffUpdateProfile,
  staffUpdateAvailability,
} from '../services/api';

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

/* --- Assignments (T19 slices 4-5: list, filter, status updates) ---------- */

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ACTION_LABELS = {
  completed: 'mark this assignment as completed',
  cancelled: 'cancel this assignment',
};

function AssignmentsSection() {
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status-update UI state
  const [confirm, setConfirm] = useState(null); // { id, status } | null
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

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
  }, [statusFilter, reloadKey]);

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

  function changeFilter(value) {
    setStatusFilter(value);
    setConfirm(null);
    setActionError(null);
    setActionSuccess(null);
  }

  function askConfirm(id, status) {
    setActionError(null);
    setActionSuccess(null);
    setConfirm({ id, status });
  }

  async function handleConfirm() {
    if (!confirm) return;
    const { id, status } = confirm;
    setBusyId(id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await staffUpdateAssignmentStatus(id, status);
      setActionSuccess(`Assignment ${status}`);
      setConfirm(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message || 'Status update failed');
      setConfirm(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SectionCard title="Assignments">
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
        <p className="text-sm text-silas-ink/60">Loading assignments…</p>
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
            const isConfirming = confirm?.id === a.id;
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

                {/* Only "assigned" items can change status (backend rule) */}
                {a.status === 'assigned' && !isConfirming && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => askConfirm(a.id, 'completed')}
                      className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                    >
                      Mark completed
                    </button>
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => askConfirm(a.id, 'cancelled')}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Cancel assignment
                    </button>
                  </div>
                )}

                {isConfirming && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                      Are you sure you want to {ACTION_LABELS[confirm.status]}?
                      This cannot be undone.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={handleConfirm}
                        className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                      >
                        {busyId === a.id ? 'Working…' : 'Yes, confirm'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => setConfirm(null)}
                        className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
                      >
                        No, go back
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* --- Issues (T19 slice 6: report faulty equipment) ----------------------- */

function IssuesSection() {
  const [equipment, setEquipment] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report form state
  const [reportingId, setReportingId] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await staffListAssignments();
        if (cancelled) return;
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.assignments)
            ? res.assignments
            : [];

        // Flatten assignments -> booking items -> equipment, unique by id
        const byId = new Map();
        for (const a of list) {
          const items = Array.isArray(a.Booking?.BookingItems)
            ? a.Booking.BookingItems
            : [];
          for (const item of items) {
            const eq = item.Equipment;
            if (eq?.id && !byId.has(eq.id)) {
              byId.set(eq.id, {
                id: eq.id,
                name: eq.name || 'Equipment',
                status: eq.status,
                venue: a.Booking?.Event?.venue || null,
              });
            }
          }
        }
        setEquipment(Array.from(byId.values()));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load equipment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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

  function canReport(status) {
    return status !== 'maintenance' && status !== 'retired';
  }

  function openForm(id) {
    setActionError(null);
    setActionSuccess(null);
    setNotes('');
    setReportingId(id);
  }

  function closeForm() {
    setReportingId(null);
    setNotes('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reportingId) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await staffReportIssue(reportingId, notes.trim() || undefined);
      setActionSuccess('Issue reported. Equipment moved to maintenance.');
      closeForm();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="Report an issue">
      <p className="mb-4 text-sm text-silas-ink/60">
        Equipment from your assignments. Reporting an issue marks the item as
        under maintenance so it is not booked out while faulty.
      </p>

      {loading && (
        <p className="text-sm text-silas-ink/60">Loading equipment…</p>
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

      {!loading && !error && equipment.length === 0 && (
        <p className="text-sm text-silas-ink/50">
          No equipment linked to your assignments yet.
        </p>
      )}

      {!loading && !error && equipment.length > 0 && (
        <ul className="space-y-3">
          {equipment.map((eq) => (
            <li
              key={eq.id}
              className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-silas-navy">{eq.name}</p>
                  {eq.venue && (
                    <p className="mt-0.5 text-sm text-silas-ink/50">
                      {eq.venue}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(eq.status)}
                  {reportingId !== eq.id && (
                    <button
                      type="button"
                      disabled={!canReport(eq.status) || submitting}
                      onClick={() => openForm(eq.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Report issue
                    </button>
                  )}
                </div>
              </div>

              {reportingId === eq.id && (
                <form
                  onSubmit={handleSubmit}
                  className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="text-sm text-amber-900">
                    This will mark <strong>{eq.name}</strong> as under
                    maintenance. An administrator can restore it afterwards.
                  </p>
                  <div>
                    <label
                      htmlFor={`issue-notes-${eq.id}`}
                      className="mb-1 block text-xs font-medium text-silas-navy"
                    >
                      What is wrong? (optional)
                    </label>
                    <textarea
                      id={`issue-notes-${eq.id}`}
                      rows={3}
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border border-silas-navy/20 bg-white px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit report'}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={closeForm}
                      className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* --- Profile (T19 slice 7: details + availability) ----------------------- */

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'on_leave', label: 'On leave' },
];

function ProfileSection() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Details form
  const [jobRole, setJobRole] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Availability
  const [availBusy, setAvailBusy] = useState(false);
  const [availError, setAvailError] = useState(null);
  const [availSuccess, setAvailSuccess] = useState(null);

  function applyProfile(p) {
    setProfile(p);
    setJobRole(p?.jobRole || '');
    setVehicleLicense(p?.vehicleLicense || '');
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await staffGetProfile();
        if (cancelled) return;
        applyProfile(res?.profile || res);
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

    if (!jobRole.trim()) {
      setFormError('Job role is required');
      return;
    }

    setSaving(true);
    try {
      const res = await staffUpdateProfile({
        jobRole: jobRole.trim(),
        vehicleLicense: vehicleLicense.trim() || null,
      });
      applyProfile(res?.profile || res);
      setFormSuccess('Profile updated');
    } catch (err) {
      setFormError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability(value) {
    if (!profile || value === profile.availability) return;
    setAvailError(null);
    setAvailSuccess(null);
    setAvailBusy(true);
    try {
      const res = await staffUpdateAvailability(value);
      applyProfile(res?.profile || res);
      setAvailSuccess('Availability updated');
    } catch (err) {
      setAvailError(err.message || 'Failed to update availability');
    } finally {
      setAvailBusy(false);
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
        <div className="space-y-8">
          {/* Read-only account info */}
          <div className="rounded-lg border border-silas-navy/10 bg-silas-cream/40 p-4 text-sm">
            <p className="text-silas-ink/50">Account</p>
            <p className="mt-1 font-medium text-silas-navy">
              {profile.User?.email || '—'}
            </p>
            <p className="text-silas-ink/60">
              @{profile.User?.username || '—'} ·{' '}
              {profile.User?.roleType || 'staff'}
            </p>
          </div>

          {/* Availability */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Availability
            </h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={availBusy}
                  aria-pressed={profile.availability === opt.value}
                  onClick={() => handleAvailability(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                    profile.availability === opt.value
                      ? 'bg-silas-navy text-white'
                      : 'bg-silas-navy/10 text-silas-navy hover:bg-silas-navy/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(availError || availSuccess) && (
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  availError
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-800'
                }`}
              >
                {availError || availSuccess}
              </p>
            )}
          </div>

          {/* Details form */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-silas-navy/70">
              Details
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="staff-job-role"
                  className="mb-1 block text-sm font-medium text-silas-navy"
                >
                  Job role
                </label>
                <input
                  id="staff-job-role"
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full rounded-lg border border-silas-navy/20 px-3 py-2 text-sm focus:border-silas-gold focus:outline-none focus:ring-1 focus:ring-silas-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="staff-vehicle"
                  className="mb-1 block text-sm font-medium text-silas-navy"
                >
                  Vehicle licence (optional)
                </label>
                <input
                  id="staff-vehicle"
                  type="text"
                  value={vehicleLicense}
                  onChange={(e) => setVehicleLicense(e.target.value)}
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
                {saving ? 'Saving…' : 'Save details'}
              </button>
            </form>
          </div>
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