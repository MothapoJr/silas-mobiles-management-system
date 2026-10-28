// src/components/SectionCard.jsx
// White content panel used on every dashboard tab

/**
 * @param {string} [title]
 * @param {import('react').ReactNode} [action] — right-side header slot (e.g. Refresh)
 * @param {import('react').ReactNode} children
 * @param {string} [className]
 */
export default function SectionCard({ title, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-silas-navy/10 bg-white p-6 shadow-[var(--shadow-card)] sm:p-7 ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          {title ? (
            <h2
              className="text-xl font-semibold tracking-tight text-silas-navy"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
// src/components/SectionCard.jsx
// White content panel used on every dashboard tab

/**
 * @param {string} [title]
 * @param {import('react').ReactNode} [action] — right-side header slot (e.g. Refresh)
 * @param {import('react').ReactNode} children
 * @param {string} [className]
 */
export default function SectionCard({ title, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-silas-navy/10 bg-white p-6 shadow-[var(--shadow-card)] sm:p-7 ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          {title ? (
            <h2
              className="text-xl font-semibold tracking-tight text-silas-navy"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
