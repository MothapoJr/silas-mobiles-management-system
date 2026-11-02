// src/components/EquipmentImage.jsx
// Catalogue image for an equipment item.
//
// Tries, in order:
//   1. item.imageUrl (if the API supplies one)
//   2. Known public photos for seeded catalogue items (root of /public)
//   3. /equipment/<name-slug>.jpg|.jpeg|.png
//   4. /equipment/<category-slug>.jpg|.jpeg|.png
//   5. /<name-slug>.jpg|.jpeg|.png (files already committed at public root)
//   6. Branded category illustration (always available)
//
// Photos currently in frontend/public/:
//   marquee-tent.jpeg, chafing-dish-food-warmer-set.jpeg,
//   freestanding-handwash-station.jpg, mobile-cold-room-medium.jpeg,
//   mobile-kitchen-unit-standard.jpeg, patio-gas-heater.jpg,
//   vip-portable-toilet.jpeg

import { useState } from 'react';

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function kindFor(text) {
  const t = String(text || '').toLowerCase();
  if (/tent|marquee|d[eé]cor/.test(t)) return 'tent';
  if (/warmer|chafing/.test(t)) return 'warmer';
  if (/hand ?wash|basin/.test(t)) return 'handwash';
  if (/fridge|cold|freez/.test(t)) return 'fridge';
  if (/kitchen/.test(t)) return 'kitchen';
  if (/heater|gas/.test(t)) return 'heater';
  if (/toilet|restroom|portable/.test(t)) return 'toilet';
  if (/bar|trailer/.test(t)) return 'bar';
  return 'generic';
}

/** Explicit map from equipment name / partial name → public file path. */
const KNOWN_PHOTOS = [
  { match: /6x12m|marquee|tent/i, src: '/marquee-tent.jpeg' },
  { match: /chafing|food warmer/i, src: '/chafing-dish-food-warmer-set.jpeg' },
  { match: /handwash|hand.?wash/i, src: '/freestanding-handwash-station.jpg' },
  { match: /cold room|fridge|mobile cold/i, src: '/mobile-cold-room-medium.jpeg' },
  { match: /kitchen/i, src: '/mobile-kitchen-unit-standard.jpeg' },
  { match: /gas heater|patio/i, src: '/patio-gas-heater.jpg' },
  { match: /toilet|vip portable/i, src: '/vip-portable-toilet.jpeg' },
];

function knownPhotoFor(name, category) {
  const haystack = `${name || ''} ${category || ''}`;
  for (const entry of KNOWN_PHOTOS) {
    if (entry.match.test(haystack)) return entry.src;
  }
  return null;
}

const ICONS = {
  tent: (
    <>
      <path d="M6 46 32 14l26 32z" />
      <path d="M32 14v32" />
      <path d="M4 52h56" />
    </>
  ),
  warmer: (
    <>
      <path d="M10 36a22 18 0 0 1 44 0z" />
      <path d="M6 36h52" />
      <path d="M16 44h32" />
      <circle cx="32" cy="14" r="2" />
    </>
  ),
  handwash: (
    <>
      <path d="M12 34h40v6a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" />
      <path d="M32 12v8" />
      <path d="M32 12h12v6" />
      <path d="M44 24v4" />
    </>
  ),
  fridge: (
    <>
      <rect x="16" y="8" width="32" height="48" rx="4" />
      <path d="M16 28h32" />
      <path d="M22 16v6M22 34v8" />
    </>
  ),
  kitchen: (
    <>
      <rect x="8" y="22" width="48" height="30" rx="3" />
      <path d="M8 32h48" />
      <circle cx="22" cy="42" r="4" />
      <circle cx="42" cy="42" r="4" />
      <path d="M20 22V14h24v8" />
    </>
  ),
  heater: (
    <>
      <path d="M14 24a18 12 0 0 1 36 0z" />
      <path d="M32 24v32" />
      <path d="M22 56h20" />
      <path d="M32 30c-3 3-3 6 0 8 3-2 3-5 0-8z" />
    </>
  ),
  toilet: (
    <>
      <rect x="18" y="8" width="28" height="48" rx="3" />
      <path d="M32 8v48" />
      <circle cx="28" cy="34" r="1.5" />
      <circle cx="36" cy="34" r="1.5" />
    </>
  ),
  bar: (
    <>
      <path d="M8 28h48v6H8z" />
      <path d="M14 34v18M50 34v18" />
      <path d="M20 28V16h8v12M38 28V20h6v8" />
    </>
  ),
  generic: (
    <>
      <rect x="10" y="18" width="44" height="32" rx="4" />
      <path d="M10 28h44" />
      <path d="M26 38h12" />
    </>
  ),
};

function Illustration({ kind }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-silas-cream to-white text-silas-navy/40"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[kind] || ICONS.generic}
      </svg>
    </div>
  );
}

/**
 * @param {string} name — equipment name
 * @param {string} [category] — category name (e.g. "Mobile Kitchens")
 * @param {string} [imageUrl] — explicit image URL if the API provides one
 * @param {string} [className]
 */
export default function EquipmentImage({
  name,
  category,
  imageUrl,
  className = '',
}) {
  const nameSlug = name ? slugify(name) : null;
  const catSlug = category ? slugify(category) : null;
  const known = knownPhotoFor(name, category);

  const candidates = [
    imageUrl,
    known,
    nameSlug ? `/equipment/${nameSlug}.jpg` : null,
    nameSlug ? `/equipment/${nameSlug}.jpeg` : null,
    nameSlug ? `/equipment/${nameSlug}.png` : null,
    catSlug ? `/equipment/${catSlug}.jpg` : null,
    catSlug ? `/equipment/${catSlug}.jpeg` : null,
    nameSlug ? `/${nameSlug}.jpg` : null,
    nameSlug ? `/${nameSlug}.jpeg` : null,
    nameSlug ? `/${nameSlug}.png` : null,
  ].filter(Boolean);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = candidates[index];
  const kind =
    kindFor(category) !== 'generic' ? kindFor(category) : kindFor(name);

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-t-xl bg-silas-cream ${className}`}
    >
      <Illustration kind={kind} />
      {src && (
        <img
          key={src}
          src={src}
          alt={name || 'Equipment'}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setIndex((i) => i + 1);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-ui ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
