// src/components/Footer.jsx
// Slim, shared footer: business contact + project credit. Used by every dashboard and the landing page.

export default function Footer({ className = '' }) {
  const year = new Date().getFullYear();
  const link =
    'transition-ui hover:text-silas-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy';

  return (
    <footer className={`border-t border-silas-navy/10 bg-white ${className}`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-xs text-silas-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} Silas Mobiles (Silas Projects) · Pretoria, South Africa
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="tel:+27607185689" className={link}>
            060 718 5689
          </a>
          <a href="mailto:silasndhlovu@gmail.com" className={link}>
            silasndhlovu@gmail.com
          </a>
          <span className="text-silas-muted/80">
            Built by The Dev-Masters · INSY7315
          </span>
        </p>
      </div>
    </footer>
  );
}