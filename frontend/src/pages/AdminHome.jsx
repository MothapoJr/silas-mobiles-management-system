// src/pages/AdminHome.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminHome() {
  const { user, logout } = useAuth();
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
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1
          className="text-2xl font-semibold text-silas-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Administrator dashboard
        </h1>
        <p className="mt-2 text-silas-ink/60">
          T18 will expand this into the full admin experience.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block text-sm text-silas-navy hover:underline"
        >
          ← Home
        </Link>
      </main>
    </div>
  );
}