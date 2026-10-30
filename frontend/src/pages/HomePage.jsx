// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../context/AuthContext';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function HomePage() {
  const { isAuthenticated, roleType, user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-silas-cream">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl border border-silas-navy/10 bg-white px-8 py-10 shadow-[var(--shadow-card)] sm:px-10 sm:py-11">
          <div
            className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-silas-gold/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-silas-navy/5 blur-2xl"
            aria-hidden
          />

          <div className="relative mb-6">
            <Logo variant="lockup" to={null} />
          </div>

          <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-silas-gold-deep">
            Operations platform
          </p>

          <h1
            className="relative mt-2 text-3xl font-semibold leading-tight tracking-tight text-silas-navy sm:text-[2rem]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Management System
          </h1>

          <p className="relative mt-3 max-w-sm text-[0.95rem] leading-relaxed text-silas-muted">
            Booking, inventory and staff platform for Silas Mobiles&apos; event
            equipment and catering business.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center gap-3">
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
                <span className="w-full text-sm text-silas-muted sm:ml-1 sm:w-auto">
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
      <Footer />
    </div>
  );
}