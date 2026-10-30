// src/components/StatusBadge.jsx
// Semantic status chips — consistent across Client / Admin / Staff / Finance

const TONES = {
  // bookings / assignments
  pending: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  confirmed: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  cancelled: 'bg-red-100 text-red-800 ring-red-200/80',
  assigned: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  completed: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  active: 'bg-sky-100 text-sky-900 ring-sky-200/80',
  disputed: 'bg-orange-100 text-orange-900 ring-orange-200/80',
  // equipment
  available: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  reserved: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  active_deployment: 'bg-sky-100 text-sky-900 ring-sky-200/80',
  maintenance: 'bg-orange-100 text-orange-900 ring-orange-200/80',
  retired: 'bg-slate-200 text-slate-700 ring-slate-300/80',
  // invoices / payments
  unpaid: 'bg-red-100 text-red-800 ring-red-200/80',
  partial: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  paid: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  // quotes
  draft: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  sent: 'bg-sky-100 text-sky-900 ring-sky-200/80',
  accepted: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  rejected: 'bg-red-100 text-red-800 ring-red-200/80',
  expired: 'bg-slate-200 text-slate-600 ring-slate-300/80',
  // staff availability
  unavailable: 'bg-slate-200 text-slate-700 ring-slate-300/80',
  'on leave': 'bg-violet-100 text-violet-900 ring-violet-200/80',
  on_leave: 'bg-violet-100 text-violet-900 ring-violet-200/80',
};

const DEFAULT = 'bg-silas-navy/10 text-silas-navy ring-silas-navy/15';

/**
 * @param {string} status — raw status string from API
 * @param {string} [className]
 */
export default function StatusBadge({ status, className = '' }) {
  const key = String(status || '').toLowerCase().trim();
  const tone = TONES[key] || DEFAULT;
  const label = key ? key.replace(/_/g, ' ') : 'unknown';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${tone} ${className}`}
    >
      {label}
    </span>
  );
}