// src/components/ClientNotifications.jsx
// Client "Notifications" tab. Makes the Observer pattern visible: every
// booking status change (approve / reject / cancel) creates a row on the
// server, and it appears here.
import { useEffect, useState } from 'react';
import SectionCard from './SectionCard';
import { listNotifications, markNotificationRead } from '../services/api';
import { isUnread, toNotificationList } from '../hooks/useNotifications';

const TYPE_LABELS = {
  'booking.confirmed': 'Booking confirmed',
  'booking.cancelled': 'Booking cancelled',
  'booking.active': 'Booking active',
  'booking.completed': 'Booking completed',
  'booking.disputed': 'Booking disputed',
  'booking.expired': 'Booking expired',
};

function typeLabel(type) {
  if (!type) return 'Update';
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  const text = String(type).replace(/[._]/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * @param {() => void} [onChange] — called after read-state changes so the
 *   parent can refresh the unread count shown on the tab.
 */
export default function ClientNotifications({ onChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [busyAll, setBusyAll] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await listNotifications();
        if (cancelled) return;
        setItems(toNotificationList(res));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load notifications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const unread = items.filter(isUnread);

  function markLocal(ids) {
    const set = new Set(ids);
    setItems((cur) =>
      cur.map((n) => (set.has(n.id) ? { ...n, status: 'read' } : n))
    );
  }

  async function handleRead(id) {
    setActionError(null);
    setBusyId(id);
    try {
      await markNotificationRead(id);
      markLocal([id]);
      if (onChange) onChange();
    } catch (err) {
      setActionError(err.message || 'Could not mark as read');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReadAll() {
    setActionError(null);
    setBusyAll(true);
    const ids = unread.map((n) => n.id);
    try {
      await Promise.all(ids.map((id) => markNotificationRead(id)));
      markLocal(ids);
      if (onChange) onChange();
    } catch (err) {
      setActionError(err.message || 'Could not mark all as read');
      setReloadKey((k) => k + 1);
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <SectionCard
      title="Notifications"
      action={
        <div className="flex flex-wrap items-center gap-2">
          {unread.length > 0 && (
            <button
              type="button"
              disabled={busyAll || loading}
              onClick={handleReadAll}
              className="rounded-lg bg-silas-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-silas-navy-deep disabled:opacity-50"
            >
              {busyAll ? 'Working…' : 'Mark all as read'}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs font-medium text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-silas-muted">
        You are notified automatically whenever the status of one of your
        bookings changes.
      </p>

      {loading && (
        <p className="text-sm text-silas-muted">Loading notifications…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-silas-navy/15 bg-white/60 px-4 py-8 text-center text-sm text-silas-muted">
          No notifications yet. An update will appear here as soon as an
          administrator approves or rejects a booking, or you cancel one.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-2.5" aria-label="Notifications">
          {items.map((n) => {
            const isNew = isUnread(n);
            return (
              <li
                key={n.id}
                className={`rounded-xl border bg-white p-3.5 shadow-sm transition-ui ${
                  isNew
                    ? 'border-silas-navy/10 border-l-4 border-l-silas-gold'
                    : 'border-silas-navy/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-silas-navy/70">
                        {typeLabel(n.type)}
                      </p>
                      {isNew && (
                        <span className="rounded-full bg-silas-gold/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-silas-navy">
                          New
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 break-words text-sm leading-relaxed ${
                        isNew ? 'font-medium text-silas-ink' : 'text-silas-muted'
                      }`}
                    >
                      {n.message}
                    </p>
                    {formatWhen(n.createdAt) && (
                      <p className="mt-1 text-xs tabular-nums text-silas-muted">
                        {formatWhen(n.createdAt)}
                      </p>
                    )}
                  </div>
                  {isNew && (
                    <button
                      type="button"
                      disabled={busyId === n.id || busyAll}
                      onClick={() => handleRead(n.id)}
                      className="shrink-0 rounded-lg border border-silas-navy/20 px-3 py-1.5 text-xs font-medium text-silas-navy hover:bg-silas-navy/5 disabled:opacity-50"
                    >
                      {busyId === n.id ? 'Saving…' : 'Mark as read'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}