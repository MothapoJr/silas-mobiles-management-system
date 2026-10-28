// src/components/Logo.jsx
import { Link } from 'react-router-dom';

export default function Logo({ variant = 'mark', to = '/', className = '' }) {
  const height = variant === 'lockup' ? 'h-12 sm:h-14' : 'h-8';

  const img = (
    <img
      src="/silas-logo.svg"
      alt="Silas Mobiles"
      className={`${height} w-auto object-contain ${className}`}
      draggable={false}
    />
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center transition-ui hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-silas-navy"
        aria-label="Silas Mobiles home"
      >
        {img}
      </Link>
    );
  }

  return img;
}