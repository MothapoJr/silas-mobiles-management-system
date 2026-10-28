// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login, isAuthenticated, roleType } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && roleType) {
    navigate(ROLE_HOME[roleType] || '/', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(emailOrUsername.trim(), password);
      const dest = ROLE_HOME[user.roleType] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'mt-1.5 w-full rounded-lg border border-silas-navy/15 bg-silas-cream/40 px-3 py-2.5 text-sm text-silas-ink outline-none transition-ui placeholder:text-silas-muted/60 focus:border-silas-navy focus:bg-white focus:ring-2 focus:ring-silas-navy/15';

  return (
    <div className="min-h-screen bg-silas-cream">
      <main className="mx-auto flex min-h-screen max-w-[22rem] flex-col justify-center px-6 py-14 sm:max-w-md">
        <div className="rounded-2xl border border-silas-navy/10 bg-white px-7 py-9 shadow-[var(--shadow-card)] sm:px-8 sm:py-10">
          <div className="mb-7">
            <Logo variant="lockup" to="/" />
          </div>

          <h1
            className="text-2xl font-semibold tracking-tight text-silas-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sign in
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-silas-muted">
            Use your work account to access the management system.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="emailOrUsername"
                className="block text-sm font-medium text-silas-ink"
              >
                Email or username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                autoComplete="username"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className={fieldClass}
                placeholder="client@silasmobiles.local"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-silas-ink"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-lg bg-silas-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-ui hover:bg-silas-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-silas-muted">
            <Link
              to="/"
              className="font-medium text-silas-navy transition-ui hover:underline"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
