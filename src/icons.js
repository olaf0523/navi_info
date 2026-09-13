export const svg = (body, size = 18) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  lock: svg('<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', 16),
  shield: svg('<path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.9 7 9 4.1-1.1 7-4.7 7-9V6l-7-2.5Z"/><path d="m9 12 2 2 4-4"/>', 15),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: svg('<path d="m3 3 18 18"/><path d="M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.1 3.9M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  backspace: svg('<path d="M9 5.5h10.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9L2.5 12 9 5.5Z"/><path d="m12.5 9.5 5 5m0-5-5 5"/>', 22),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>', 14),
  reset: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>', 15),
  arrowUpRight: svg('<path d="M7 17 17 7M8 7h9v9"/>', 14),
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 14),
  arrowUp: svg('<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>', 20),
  close: svg('<path d="m6 6 12 12M18 6 6 18"/>', 20),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>', 15),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>', 15),

  // Company profile modal
  home: svg('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5v10h13v-10"/><path d="M10 19.5v-5h4v5"/>', 20),
  building: svg('<path d="M4 20.5v-15A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5v15"/><path d="M15 9.5h3.5A1.5 1.5 0 0 1 20 11v9.5"/><path d="M2.5 20.5h19M8 8h3M8 12h3M8 16h3"/>', 20),
  chart: svg('<path d="M3.5 20.5h17"/><path d="M6.5 17v-4M11 17V8.5M15.5 17v-6M20 17V5"/>', 20),
  mapPin: svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>', 20),
  tag: svg('<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0Z"/><circle cx="8" cy="8" r="1.5"/>', 20),
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>', 20),
  coins: svg('<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/><path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4"/>', 20),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.3c2.1.8 3.5 2.9 3.5 5.7"/>', 20),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>', 20),
  link: svg('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>', 18),
  map: svg('<path d="m9 4.5-5.5 2v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2Z"/><path d="M9 4.5v13M15 6.5v13"/>', 20),
  external: svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>', 18),
  inbox: svg('<path d="M3.5 13.5 6 5.5A1.5 1.5 0 0 1 7.4 4.5h9.2A1.5 1.5 0 0 1 18 5.5l2.5 8"/><path d="M3.5 13.5v5a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-5h-5a3.5 3.5 0 0 1-7 0Z"/>', 22),

  filter: svg('<path d="M3.5 5h17l-6.5 7.5v5.5l-4 2v-7.5Z"/>', 18),
  sort: svg('<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4m-3.5 12.5L17 20l3.5-3.5"/>', 18),
  sliders: svg('<path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>', 18),
  bookmark: svg('<path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z"/>', 18),
  xSmall: svg('<path d="m7 7 10 10M17 7 7 17"/>', 16),

  // Performance categories
  monitor: svg('<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>', 22),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z"/>', 22),
  smartphone: svg('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>', 22),
  cart: svg('<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>', 22),
  layout: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>', 22),
  cloud: svg('<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.6 3.8 3.8 0 0 1-.4 7.4Z"/>', 22),
  headset: svg('<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3" y="13.5" width="4" height="6" rx="1.5"/><rect x="17" y="13.5" width="4" height="6" rx="1.5"/><path d="M19 19.5c0 1.2-1.5 2-4 2h-2"/>', 22),
  briefcase: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>', 22),
  sparkles: svg('<path d="m11 3.5 1.6 4.9 4.9 1.6-4.9 1.6-1.6 4.9-1.6-4.9-4.9-1.6 4.9-1.6Z"/><path d="m18.5 14.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>', 22),
  layers: svg('<path d="M12 3.5 2.5 8.5l9.5 5 9.5-5Z"/><path d="m2.5 12.5 9.5 5 9.5-5M2.5 16.5l9.5 5 9.5-5"/>', 22),
  video: svg('<rect x="2.5" y="6" width="13.5" height="12" rx="2"/><path d="m16 10.5 5.5-3v9l-5.5-3"/>', 22),
  megaphone: svg('<path d="M3.5 10v4a1 1 0 0 0 1 1H7l7.5 4.5v-15L7 9H4.5a1 1 0 0 0-1 1Z"/><path d="M18 9a4 4 0 0 1 0 6"/>', 22),
  chip: svg('<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>', 22),
  wrench: svg('<path d="M15.5 3.8a4.5 4.5 0 0 0-5.3 6l-6.4 6.4a2.1 2.1 0 0 0 3 3l6.4-6.4a4.5 4.5 0 0 0 6-5.3l-2.8 2.8-2.7-.3-.3-2.7Z"/>', 22),
  package: svg('<path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9Z"/><path d="m3.5 7.5 8.5 4.7 8.5-4.7M12 12.2v9"/>', 22),
  grid: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>', 22),
};

export const CATEGORY_ICON_NAMES = {
  '業務システム': 'monitor',
  'WEBシステム': 'globe',
  'アプリ開発': 'smartphone',
  'ECサイト構築': 'cart',
  'ホームページ制作': 'layout',
  'サーバー・クラウド': 'cloud',
  '情シス・社内IT支援': 'headset',
  'コンサル・PM': 'briefcase',
  'AI': 'sparkles',
  'CMS構築': 'layers',
  '動画制作': 'video',
  'WEBマーケティング': 'megaphone',
  '組み込みシステム開発': 'chip',
  '業務支援ツール開発': 'wrench',
  'ASP・パッケージ': 'package',
};

export const categoryIconName = (label) => CATEGORY_ICON_NAMES[label] || 'grid';

const SPRITE_PREFIX = 'hn-i-';

// Lightweight reference to a symbol from iconSprite(); used where an icon repeats hundreds of times.
// Stroke styling for these comes from the .icon-use CSS rule to keep the markup short.
export const useIcon = (name, size = 16) =>
  `<svg class="icon icon-use" width="${size}" height="${size}" aria-hidden="true"><use href="#${SPRITE_PREFIX}${name}"/></svg>`;

export function iconSprite(names) {
  const symbols = [...new Set(names)].map((name) => {
    const body = icons[name].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    return `<symbol id="${SPRITE_PREFIX}${name}" viewBox="0 0 24 24">${body}</symbol>`;
  }).join('');
  return `<svg class="icon-sprite" width="0" height="0" aria-hidden="true" focusable="false">${symbols}</svg>`;
}
