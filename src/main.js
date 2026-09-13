import './style.css';
import { cryptoSupported, decryptVault, deriveKey, exportKey, importKey, parseVault } from './crypto.js';
import { mountDirectory } from './directory.js';
import { mountLock } from './lock.js';

const VAULT_URL = `${import.meta.env.BASE_URL}data/companies.bin`;
const SESSION_KEY = 'hnavi.session.v1';

const app = document.querySelector('#app');
app.innerHTML = '<div data-layer="app"></div><div data-layer="lock"></div>';
const appLayer = app.querySelector('[data-layer="app"]');
const lockLayer = app.querySelector('[data-layer="lock"]');

let vaultPromise = null;
let directory = null;
let lock = null;

// The derived key (never the PIN) is kept for this tab only, so a reload does not re-lock.
const session = {
  get() { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } },
  set(value) { try { sessionStorage.setItem(SESSION_KEY, value); } catch { /* unlock still works for this view */ } },
  clear() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing stored */ } },
};

function loadVault() {
  if (!vaultPromise) {
    vaultPromise = fetch(VAULT_URL, { cache: 'no-cache' }).then(async (response) => {
      if (!response.ok) throw new Error(`Data file request failed: ${response.status}`);
      return parseVault(await response.arrayBuffer());
    });
    vaultPromise.catch(() => { vaultPromise = null; });
  }
  return vaultPromise;
}

async function unlockWithPin(pin) {
  const vault = await loadVault();
  const key = await deriveKey(pin, vault);
  const csv = await decryptVault(key, vault);
  if (csv !== null) session.set(await exportKey(key));
  return csv;
}

async function restoreSession() {
  const stored = session.get();
  if (!stored || !cryptoSupported()) return null;
  let key;
  try {
    key = await importKey(stored);
  } catch {
    session.clear();
    return null;
  }
  try {
    const csv = await decryptVault(key, await loadVault());
    if (csv === null) session.clear();
    return csv;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function showDirectory(csv) {
  directory?.destroy();
  appLayer.inert = false;
  directory = mountDirectory(appLayer, { csv, onLock: lockNow });
}

function showLock({ entering = false } = {}) {
  lock?.destroy();
  lock = mountLock(lockLayer, {
    verify: unlockWithPin,
    preload: loadVault,
    supported: cryptoSupported(),
    entering,
    onUnlocked: showDirectory,
    onClosed: () => { lock = null; },
  });
}

function lockNow() {
  session.clear();
  appLayer.inert = true;
  showLock({ entering: true });
  const previous = directory;
  directory = null;
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
  setTimeout(() => {
    previous?.destroy();
    window.scrollTo(0, 0);
  }, delay);
}

const restored = await restoreSession();
if (restored !== null) showDirectory(restored);
else showLock();
