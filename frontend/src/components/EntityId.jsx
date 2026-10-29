// src/components/EntityId.jsx
// Full entity ID display — monospace, optional copy, consistent across roles.
import { useState } from 'react';

/**
 * @param {string|number} id
 * @param {string} [label] — e.g. "Quote", "Booking", "Invoice", "Assignment"
 * @param {boolean} [copyable=true]
 * @param {'title'|'inline'} [variant='title'] — title = label + ID block; inline = compact mono ID only
 * @param {string} [className]
 */
export default function EntityId({
  id,
  label,
  copyable = true,
  variant = 'title',
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const full = id != null && id !== '' ? String(id) : '';

  async function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!full) return;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked; ignore quietly
    }
  }

  if (!full) {
    return (
      <span className={`text-silas-ink/40 ${className}`}>
        {label ? `${label} —` : '—'}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <code className="rounded bg-silas-navy/[0.06] px-1.5 py-0.5 font-mono text-[11px] leading-none tracking-tight text-silas-ink/70 break-all">
          {full}
        </code>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied' : 'Copy ID'}
            aria-label={copied ? 'Copied' : 'Copy ID'}
            className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-silas-navy/50 hover:bg-silas-navy/10 hover:text-silas-navy transition-ui"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </span>
    );
  }

  // title variant — primary row heading
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-silas-navy/50">
          {label}
        </p>
      )}
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <code className="break-all font-mono text-[13px] font-medium leading-snug tracking-tight text-silas-navy">
          {full}
        </code>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied' : 'Copy full ID'}
            aria-label={copied ? 'Copied' : 'Copy full ID'}
            className="shrink-0 rounded-md border border-silas-navy/10 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-silas-navy/60 shadow-sm hover:border-silas-navy/25 hover:text-silas-navy transition-ui"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
