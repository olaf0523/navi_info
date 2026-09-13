const svg = (body, size = 18) =>
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
};
