// src/components/DashboardHeader.jsx
import Logo from './Logo';

export default function DashboardHeader({ title, email, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-silas-navy/10 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Logo variant="mark" to="/" />
          <div className="min-w-0 border-l border-silas-navy/10 pl-3">
            <p className="truncate text-sm font-semibold text-silas-navy">{title}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {email ? (
            <span className="hidden max-w-[14rem] truncate text-sm text-silas-muted sm:inline">
              {email}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-silas-navy/15 bg-white px-3 py-1.5 text-sm font-medium text-silas-navy transition-ui hover:border-silas-navy/30 hover:bg-silas-navy/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}