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

  return (
    <div className="min-h-screen bg-silas-cream">
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-silas-navy/10 bg-white px-8 py-10 shadow-[var(--shadow-card)]">
          <div className="mb-8">
            <Logo variant="lockup" to="/" />
          </div>

          <h1
            className="text-2xl font-semibold tracking-tight text-silas-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sign in
          </h1>
          <p className="mt-2 text-sm text-silas-muted">
            Use your work account to access the management system.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                className="mt-1.5 w-full rounded-lg border border-silas-navy/15 bg-white px-3 py-2.5 text-sm text-silas-ink outline-none transition-ui focus:border-silas-navy focus:ring-2 focus:ring-silas-navy/20"
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
                className="mt-1.5 w-full rounded-lg border border-silas-navy/15 bg-white px-3 py-2.5 text-sm text-silas-ink outline-none transition-ui focus:border-silas-navy focus:ring-2 focus:ring-silas-navy/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-silas-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-ui hover:bg-silas-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-silas-muted">
            <Link to="/" className="font-medium text-silas-navy transition-ui hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
