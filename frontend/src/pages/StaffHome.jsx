// src/pages/StaffHome.jsx
// Staff dashboard shell (T19). Same layout as ClientHome / AdminHome.
// Tabs: Assignments | Issues | Profile. Panels are filled in by later slices.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'assignments', label: 'Assignments' },
  { id: 'issues', label: 'Issues' },
  { id: 'profile', label: 'Profile' },
];

export default function StaffHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');

  return (
    <div className="min-h-screen bg-silas-cream">
      {/* Header */}
      <header className="border-b border-silas-navy/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-silas-navy text-xs font-semibold text-silas-gold">
              S
            </span>
            <span className="text-sm font-medium text-silas-navy">
              Staff dashboard
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

      {/* Nav tabs */}
      <nav
        aria-label="Staff navigation"
        className="border-b border-silas-navy/10 bg-white"
      >
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-silas-gold text-silas-navy'
                  : 'border-transparent text-silas-ink/50 hover:text-silas-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {activeTab === 'assignments' && <AssignmentsSection />}
        {activeTab === 'issues' && <IssuesSection />}
        {activeTab === 'profile' && <ProfileSection />}

        <Link
          to="/"
          className="mt-10 inline-block text-sm text-silas-navy hover:underline"
        >
          ← Home
        </Link>
      </main>
    </div>
  );
}

/* --- Section placeholders (filled in by later T19 slices) --------------- */

function AssignmentsSection() {
  return (
    <SectionCard title="Assignments">
      <p className="text-sm text-silas-ink/60">
        Your assigned deliveries and collections will appear here.
      </p>
    </SectionCard>
  );
}

function IssuesSection() {
  return (
    <SectionCard title="Report an issue">
      <p className="text-sm text-silas-ink/60">
        Report faulty equipment from your assignments here.
      </p>
    </SectionCard>
  );
}

function ProfileSection() {
  return (
    <SectionCard title="Profile">
      <p className="text-sm text-silas-ink/60">
        Your details and availability will appear here.
      </p>
    </SectionCard>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-silas-navy/10 bg-white p-6 shadow-sm">
      <h2
        className="mb-4 text-xl font-semibold text-silas-navy"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}