// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, roleType, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-silas-cream">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-silas-navy/10 bg-white px-8 pb-12 pt-10 sm:px-12 sm:pt-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-silas-navy text-sm font-semibold text-silas-gold">
              S
            </span>
            <span className="text-sm font-medium tracking-wide text-silas-ink/60">
              Silas Mobiles
            </span>
          </div>

          <h1
            className="text-3xl font-semibold leading-tight text-silas-navy sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Management System
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-silas-ink/70">
            Booking, inventory and staff platform for Silas Mobiles&apos; event
            equipment and catering business.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROLE_HOME[roleType] || '/'}
                  className="rounded-lg bg-silas-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-silas-navy-deep"
                >
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg border border-silas-navy/20 px-5 py-2.5 text-sm font-medium text-silas-navy hover:bg-silas-navy/5"
                >
                  Sign out
                </button>
                <span className="w-full text-sm text-silas-ink/50 sm:w-auto sm:ml-2">
                  Signed in as {user?.email || user?.username || 'user'}
                </span>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-silas-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-silas-navy-deep"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}