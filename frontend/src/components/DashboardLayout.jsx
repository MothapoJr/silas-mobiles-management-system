// src/components/DashboardLayout.jsx
// One shell for all four role dashboards: sticky header, tab bar, content, footer.
// Replaces the tab-bar markup that was copy-pasted in Client / Admin / Staff / Finance.
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';

/**
 * @param {string} title
 * @param {string} [email]
 * @param {() => void} onLogout
 * @param {{ id: string, label: string }[]} tabs
 * @param {string} activeTab
 * @param {(id: string) => void} onTabChange
 * @param {string} [navLabel] — accessible name for the tab bar
 */
export default function DashboardLayout({
  title,
  email,
  onLogout,
  tabs,
  activeTab,
  onTabChange,
  navLabel,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-silas-cream">
      <DashboardHeader title={title} email={email} onLogout={onLogout} />

      <nav
        aria-label={navLabel || `${title} navigation`}
        className="border-b border-silas-navy/10 bg-white"
      >
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-ui focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-silas-navy ${
                activeTab === tab.id
                  ? 'border-silas-gold text-silas-navy'
                  : 'border-transparent text-silas-muted hover:text-silas-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}