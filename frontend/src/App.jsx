import { useEffect, useState } from 'react';

// Where the T20 (Front-end/Back-end Integration) work eventually points the
// real API calls — reused here just to build the health-check URL below.
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const healthUrl = apiBase.replace(/\/api\/?$/, '/health');

function useBackendStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    fetch(healthUrl)
      .then((res) => (res.ok ? setStatus('connected') : setStatus('unreachable')))
      .catch(() => {
        if (!cancelled) setStatus('unreachable');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

function StatusRow({ label, state }) {
  const styles = {
    connected: 'bg-silas-gold',
    checking: 'bg-silas-navy/30 animate-pulse',
    unreachable: 'bg-silas-navy/15',
    upcoming: 'bg-silas-navy/15',
  };

  const text = {
    connected: 'Connected',
    checking: 'Checking…',
    unreachable: 'Not reachable',
    upcoming: 'Not started',
  };

  return (
    <div className="flex items-center justify-between border-b border-silas-navy/10 py-3 last:border-none">
      <span className="text-sm text-silas-ink/80">{label}</span>
      <span className="flex items-center gap-2 text-sm text-silas-ink/60">
        <span className={`h-2 w-2 rounded-full ${styles[state]}`} />
        {text[state]}
      </span>
    </div>
  );
}

function TentSkyline() {
  // A row of marquee-tent peaks — a small, specific nod to what Silas
  // Mobiles actually rents out, rather than a generic decorative shape.
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 h-14 w-full text-silas-navy/10"
      aria-hidden="true"
    >
      <polyline
        points="0,60 40,15 80,60 130,60 170,5 210,60 250,60 290,20 330,60 400,60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function App() {
  const backendStatus = useBackendStatus();

  return (
    <div className="min-h-screen bg-silas-cream">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-silas-navy/10 bg-white px-8 pb-16 pt-10 sm:px-12 sm:pt-12">
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
            The booking, inventory and staff platform for Silas Mobiles&apos;
            event equipment and catering business is being built here. This
            page confirms the front end is wired up — the Client,
            Administrator and Staff dashboards build out from T16 onward.
          </p>

          <div className="mt-10 border-t border-silas-navy/10 pt-6">
            <StatusRow label="Backend API" state={backendStatus} />
            <StatusRow label="Client dashboard" state="upcoming" />
            <StatusRow label="Administrator dashboard" state="upcoming" />
            <StatusRow label="Staff interface" state="upcoming" />
          </div>

          <TentSkyline />
        </div>
      </main>
    </div>
  );
}
