// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function HomePage() {
  const { isAuthenticated, roleType, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-silas-cream">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20">
        <div
          className="relative overflow-hidden rounded-2xl border border-silas-navy/10 bg-white px-8 pb-12 pt-10 shadow-[var(--shadow-card)] sm:px-12 sm:pt-12"
        >
          {/* soft brand accent */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-silas-gold/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-silas-navy/5 blur-2xl"
            aria-hidden
          />

          <div className="relative mb-8">
            <Logo variant="lockup" to={null} />
          </div>

          <h1
            className="relative text-3xl font-semibold leading-tight tracking-tight text-silas-navy sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Management System
          </h1>

          <p className="relative mt-4 max-w-md text-base leading-relaxed text-silas-muted">
            Booking, inventory and staff platform for Silas Mobiles&apos; event
            equipment and catering business.
          </p>

          <div className="relative mt-10 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROLE_HOME[roleType] || '/'}
                  className="rounded-lg bg-silas-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-ui hover:bg-silas-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy"
                >
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-lg border border-silas-navy/20 px-5 py-2.5 text-sm font-medium text-silas-navy transition-ui hover:bg-silas-navy/5"
                >
                  Sign out
                </button>
                <span className="w-full text-sm text-silas-muted sm:ml-2 sm:w-auto">
                  Signed in as {user?.email || user?.username || 'user'}
                </span>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-silas-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-ui hover:bg-silas-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy"
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
