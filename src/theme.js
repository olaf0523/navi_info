// Day/night mode. The initial theme is applied by the inline script in index.html
// (before first paint); keep STORAGE_KEY in sync with it.
import { icons } from './icons.js';

const STORAGE_KEY = 'hnavi.theme.v1';
const THEMES = ['light', 'dark'];
const THEME_COLORS = { light: '#f2f1ec', dark: '#0f1115' };
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let chosenTheme = null; // Fallback when localStorage is blocked.
let switchTimer = 0;

function storedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(value)) return value;
  } catch {
    // Storage blocked: use the in-memory choice.
  }
  return chosenTheme;
}

const preferredTheme = () => storedTheme() ?? (systemDark.matches ? 'dark' : 'light');

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme, { animate = false } = {}) {
  const root = document.documentElement;
  if (animate && !reduceMotion.matches) {
    root.classList.add('is-theme-switching');
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => root.classList.remove('is-theme-switching'), 320);
  }
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  for (const button of document.querySelectorAll('[data-theme-set]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme));
  }
}

export function themeToggleHtml() {
  const theme = currentTheme();
  const option = (value, icon, label) =>
    `<button type="button" class="theme-option" data-theme-set="${value}" aria-pressed="${theme === value}" aria-label="${label}モード" title="${label}モード">${icon}<span>${label}</span></button>`;
  return `<div class="theme-toggle" role="group" aria-label="表示モード">${option('light', icons.sun, 'デイ')}${option('dark', icons.moon, 'ナイト')}</div>`;
}

export function initTheme() {
  applyTheme(preferredTheme());

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-theme-set]');
    const theme = button?.dataset.themeSet;
    if (!THEMES.includes(theme) || theme === currentTheme()) return;
    chosenTheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
    applyTheme(theme, { animate: true });
  });

  // Follow the OS setting until the user picks a mode.
  systemDark.addEventListener('change', () => {
    if (!storedTheme()) applyTheme(preferredTheme(), { animate: true });
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) applyTheme(preferredTheme(), { animate: true });
  });
}
