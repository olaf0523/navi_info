import { icons } from './icons.js';
import { themeToggleHtml } from './theme.js';

const PIN_LENGTH = 15;
const GROUP_SIZE = 5;
const MAX_FAILURES = 5;
const BASE_LOCKOUT_MS = 30_000;
const MAX_LOCKOUT_MS = 15 * 60_000;
const THROTTLE_KEY = 'hnavi.lock.throttle.v1';

// Key geometry in SVG user units (viewBox 0 0 770 190).
const SLOT_START = 222;
const SLOT_WIDTH = 30;
const GROUP_GAP = 15;
const TOOTH_TOP = 112;
const TOOTH_DEPTH = 56;
const BOW_X = 92;
const BOW_Y = 96;
const PROGRESS_RADIUS = 55;
const PROGRESS_LENGTH = 2 * Math.PI * PROGRESS_RADIUS;

const MESSAGES = {
  verifying: '鍵を照合しています…',
  success: '解錠しました。',
  loadError: 'データを読み込めませんでした。接続を確認して、もう一度お試しください。',
  unsupported: 'この接続では解錠できません。HTTPS または localhost で開いてください。',
  retry: 'もう一度入力できます。',
};

const slotCenter = (index) => SLOT_START + index * SLOT_WIDTH + Math.floor(index / GROUP_SIZE) * GROUP_GAP + SLOT_WIDTH / 2;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let memoryThrottle = { failures: 0, lockouts: 0, until: 0 };

function readThrottle() {
  try {
    const stored = JSON.parse(localStorage.getItem(THROTTLE_KEY));
    if (stored && [stored.failures, stored.lockouts, stored.until].every(Number.isFinite)) return stored;
  } catch {
    // Fall through to the in-memory copy.
  }
  return { ...memoryThrottle };
}

function writeThrottle(throttle) {
  memoryThrottle = throttle;
  try {
    localStorage.setItem(THROTTLE_KEY, JSON.stringify(throttle));
  } catch {
    // Storage blocked: the in-memory copy still throttles this page view.
  }
}

function keySvg() {
  const teeth = [];
  const labels = [];
  const ticks = [];
  for (let index = 0; index < PIN_LENGTH; index += 1) {
    const x = slotCenter(index);
    teeth.push(`<path class="key-tooth" fill="url(#hnKeyBrass)" d="M${x - 13} ${TOOTH_TOP}H${x + 13}L${x + 5} ${TOOTH_TOP + TOOTH_DEPTH}H${x - 5}Z"/>`);
    labels.push(`<text class="key-digit" x="${x}" y="102.5" text-anchor="middle"></text>`);
    ticks.push(`<path class="key-tick" d="M${x} 108.5V114"/>`);
  }
  const blade = 'M186 76H726L752 96L726 116H186Z';
  const bow = `M${BOW_X - 80} ${BOW_Y}a80 80 0 1 0 160 0a80 80 0 1 0-160 0ZM${BOW_X - 30} ${BOW_Y}a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z`;

  return `<svg class="key-svg" viewBox="0 0 770 190" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="hnKeyBrass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f8e3a6"/><stop offset=".48" stop-color="#d8a84f"/><stop offset="1" stop-color="#9a6b25"/>
      </linearGradient>
      <linearGradient id="hnKeySheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="hnKeyBladeClip"><path d="${blade}"/></clipPath>
    </defs>
    <g class="key-teeth">${teeth.join('')}</g>
    <path class="key-blade" d="${blade}" fill="url(#hnKeyBrass)"/>
    <path d="M192 78.5H724" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
    <path d="M204 84.5H708" stroke="#5a3d0e" stroke-opacity=".22" stroke-width="2"/>
    <g clip-path="url(#hnKeyBladeClip)"><rect class="key-sheen" x="110" y="70" width="90" height="52" fill="url(#hnKeySheen)"/></g>
    <g class="key-labels">${labels.join('')}</g>
    <g class="key-ticks">${ticks.join('')}</g>
    <rect x="158" y="62" width="34" height="68" rx="8" fill="url(#hnKeyBrass)"/>
    <path d="M170 68V124M180 68V124" stroke="#5a3d0e" stroke-opacity=".25" stroke-width="2"/>
    <path class="key-bow" d="${bow}" fill="url(#hnKeyBrass)" fill-rule="evenodd"/>
    <circle cx="${BOW_X}" cy="${BOW_Y}" r="78.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
    <circle cx="${BOW_X}" cy="${BOW_Y}" r="30" fill="none" stroke="#5a3d0e" stroke-opacity=".45" stroke-width="2"/>
    <circle class="key-progress-track" cx="${BOW_X}" cy="${BOW_Y}" r="${PROGRESS_RADIUS}"/>
    <circle class="key-progress is-empty" cx="${BOW_X}" cy="${BOW_Y}" r="${PROGRESS_RADIUS}" stroke-dasharray="${PROGRESS_LENGTH.toFixed(2)}" stroke-dashoffset="${PROGRESS_LENGTH.toFixed(2)}" transform="rotate(-90 ${BOW_X} ${BOW_Y})"/>
  </svg>`;
}

function template(entering) {
  const groups = Array.from({ length: PIN_LENGTH / GROUP_SIZE }, () =>
    `<span class="pin-group">${'<span class="pin-cell"></span>'.repeat(GROUP_SIZE)}</span>`).join('');
  const digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) =>
    `<button type="button" class="keypad-key" data-digit="${digit}">${digit}</button>`).join('');

  return `<div class="lock${entering ? ' is-entering' : ''}" data-state="idle">
    <div class="lock-inner">
      <header class="lock-top">
        <div class="lock-brand"><span class="brand-mark" aria-hidden="true">HN</span><span>発注ナビ 企業ディレクトリ</span></div>
        <div class="lock-top-actions">
          ${themeToggleHtml()}
          <span class="lock-badge">${icons.shield}<span>暗号化で保護</span></span>
        </div>
      </header>
      <main class="lock-main">
        <div class="lock-panel">
          <section class="lock-intro" aria-labelledby="lockTitle">
            <p class="lock-eyebrow">Secure Access</p>
            <h1 class="lock-title" id="lockTitle">15桁の鍵で、<br>解錠してください。</h1>
            <p class="lock-lead">数字を入力するたびに、鍵の歯が刻まれます。15桁すべてを刻むと自動で照合します。</p>
            <div class="key-stage">${keySvg()}</div>
            <div class="pin-readout" aria-hidden="true">${groups}</div>
            <div class="lock-meta">
              <span class="lock-counter" aria-hidden="true">00 / ${PIN_LENGTH}</span>
              <span class="sr-only" data-counter-live aria-live="polite"></span>
              <span class="lock-countdown"></span>
            </div>
            <p class="lock-status" role="status" aria-live="assertive"></p>
          </section>
          <section class="keypad-panel" aria-label="PIN入力">
            <div class="keypad">
              ${digitKeys}
              <button type="button" class="keypad-key" data-action="clear">クリア</button>
              <button type="button" class="keypad-key" data-digit="0">0</button>
              <button type="button" class="keypad-key" data-action="backspace" aria-label="1文字削除">${icons.backspace}</button>
            </div>
            <div class="keypad-actions">
              <button type="button" class="reveal-button" aria-pressed="false">${icons.eye}<span>表示</span></button>
              <button type="button" class="unlock-button" aria-disabled="true">${icons.lock}<span>解錠する</span></button>
            </div>
            <p class="keypad-hint">キーボードの数字キーや貼り付けでも入力できます</p>
          </section>
        </div>
      </main>
      <footer class="lock-foot">データは AES-256 で暗号化されており、正しいPINコードでのみ復号されます。</footer>
    </div>
  </div>`;
}

export function mountLock(root, { verify, preload, supported, entering = false, onUnlocked, onClosed }) {
  const controller = new AbortController();
  const { signal } = controller;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let digits = [];
  let busy = false;
  let revealed = false;
  let countdownTimer = 0;
  const blockedMessage = supported ? '' : MESSAGES.unsupported;

  root.innerHTML = template(entering);
  document.documentElement.classList.add('is-locked');

  const lock = root.querySelector('.lock');
  const teeth = [...root.querySelectorAll('.key-tooth')];
  const labels = [...root.querySelectorAll('.key-digit')];
  const ticks = [...root.querySelectorAll('.key-tick')];
  const cells = [...root.querySelectorAll('.pin-cell')];
  const progress = root.querySelector('.key-progress');
  const counter = root.querySelector('.lock-counter');
  const counterLive = root.querySelector('[data-counter-live]');
  const countdown = root.querySelector('.lock-countdown');
  const status = root.querySelector('.lock-status');
  const keypad = root.querySelector('.keypad');
  const keypadKeys = [...keypad.querySelectorAll('.keypad-key')];
  const revealButton = root.querySelector('.reveal-button');
  const unlockButton = root.querySelector('.unlock-button');

  const lockedFor = () => Math.max(0, readThrottle().until - Date.now());
  const inputBlocked = () => busy || Boolean(blockedMessage) || lockedFor() > 0;

  function setState(state) {
    lock.dataset.state = state;
  }

  function announce(message, tone = 'info') {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function render() {
    const count = digits.length;
    const blocked = inputBlocked();
    for (let index = 0; index < PIN_LENGTH; index += 1) {
      const cut = index < count;
      const digit = digits[index];
      teeth[index].classList.toggle('is-cut', cut);
      // Hidden PINs get uniform teeth; revealed PINs get real bitting depths per digit.
      if (cut) teeth[index].style.setProperty('--cut', revealed ? (0.3 + Number(digit) * 0.078).toFixed(3) : '0.68');
      labels[index].textContent = cut ? (revealed ? digit : '•') : '';
      labels[index].classList.toggle('is-cut', cut);
      ticks[index].classList.toggle('is-cut', cut);
      ticks[index].classList.toggle('is-next', index === count && !blocked);
      cells[index].textContent = cut ? (revealed ? digit : '•') : '';
      cells[index].classList.toggle('is-filled', cut);
      cells[index].classList.toggle('is-next', index === count && !blocked);
    }
    progress.style.strokeDashoffset = String(PROGRESS_LENGTH * (1 - count / PIN_LENGTH));
    progress.classList.toggle('is-empty', count === 0);
    counter.textContent = `${String(count).padStart(2, '0')} / ${PIN_LENGTH}`;
    counterLive.textContent = count ? `${count}桁入力済み（全${PIN_LENGTH}桁）` : '';

    for (const key of keypadKeys) {
      const action = key.dataset.action;
      const disabled = blocked || (action ? count === 0 : count === PIN_LENGTH);
      key.setAttribute('aria-disabled', String(disabled));
    }
    unlockButton.setAttribute('aria-disabled', String(blocked || count !== PIN_LENGTH));
  }

  function flash(selector) {
    const key = keypad.querySelector(selector);
    if (!key) return;
    key.classList.add('is-pressed');
    setTimeout(() => key.classList.remove('is-pressed'), 140);
  }

  function press(digit) {
    if (inputBlocked() || digits.length >= PIN_LENGTH) return;
    digits.push(digit);
    render();
    if (digits.length === PIN_LENGTH) submit();
  }

  function backspace() {
    if (inputBlocked() || !digits.length) return;
    digits.pop();
    render();
  }

  function clear() {
    if (inputBlocked() || !digits.length) return;
    digits = [];
    render();
  }

  function registerFailure() {
    const throttle = readThrottle();
    throttle.failures += 1;
    if (throttle.failures >= MAX_FAILURES) {
      throttle.lockouts += 1;
      throttle.failures = 0;
      throttle.until = Date.now() + Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * 2 ** (throttle.lockouts - 1));
    }
    writeThrottle(throttle);
    return throttle;
  }

  function startCountdown() {
    clearInterval(countdownTimer);
    setState('locked');
    const tick = () => {
      const remaining = lockedFor();
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        countdown.textContent = '';
        setState('idle');
        announce(MESSAGES.retry);
        render();
        return;
      }
      countdown.textContent = `${Math.ceil(remaining / 1000)} 秒後に再入力できます`;
    };
    tick();
    countdownTimer = setInterval(tick, 250);
    render();
  }

  async function submit() {
    if (inputBlocked() || digits.length !== PIN_LENGTH) return;
    busy = true;
    setState('verifying');
    announce(MESSAGES.verifying);
    render();

    let csv;
    try {
      [csv] = await Promise.all([verify(digits.join('')), wait(reduceMotion ? 0 : 650)]);
    } catch (error) {
      console.error(error);
      if (signal.aborted) return;
      busy = false;
      setState('idle');
      announce(MESSAGES.loadError, 'error');
      render();
      return;
    }
    if (signal.aborted) return;

    if (csv !== null) {
      writeThrottle({ failures: 0, lockouts: 0, until: 0 });
      setState('success');
      announce(MESSAGES.success, 'success');
      await wait(reduceMotion ? 150 : 900);
      if (signal.aborted) return;
      digits = [];
      onUnlocked(csv);
      lock.classList.add('is-leaving');
      await wait(reduceMotion ? 0 : 460);
      destroy();
      onClosed?.();
      return;
    }

    const throttle = registerFailure();
    setState('error');
    navigator.vibrate?.([60, 40, 60]);
    if (throttle.until > Date.now()) {
      announce(`${MAX_FAILURES}回連続で一致しなかったため、入力を一時停止しています。`, 'error');
    } else {
      announce(`PINコードが一致しません。あと${MAX_FAILURES - throttle.failures}回失敗すると、一時的に入力できなくなります。`, 'error');
    }
    await wait(reduceMotion ? 250 : 620);
    if (signal.aborted) return;
    digits = [];
    busy = false;
    if (lockedFor() > 0) startCountdown();
    else {
      setState('idle');
      render();
    }
  }

  function destroy() {
    controller.abort();
    clearInterval(countdownTimer);
    document.documentElement.classList.remove('is-locked');
    root.innerHTML = '';
  }

  keypad.addEventListener('click', (event) => {
    const key = event.target.closest('.keypad-key');
    if (!key || key.getAttribute('aria-disabled') === 'true') return;
    if (key.dataset.digit) press(key.dataset.digit);
    else if (key.dataset.action === 'clear') clear();
    else if (key.dataset.action === 'backspace') backspace();
  }, { signal });

  revealButton.addEventListener('click', () => {
    revealed = !revealed;
    revealButton.setAttribute('aria-pressed', String(revealed));
    revealButton.innerHTML = `${revealed ? icons.eyeOff : icons.eye}<span>${revealed ? '隠す' : '表示'}</span>`;
    render();
  }, { signal });

  unlockButton.addEventListener('click', () => {
    if (unlockButton.getAttribute('aria-disabled') !== 'true') submit();
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      press(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      backspace();
      flash('[data-action="backspace"]');
    } else if (event.key === 'Escape' || event.key === 'Delete') {
      clear();
      flash('[data-action="clear"]');
    } else if (event.key === 'Enter' && !event.target.closest?.('button')) {
      event.preventDefault();
      submit();
    }
  }, { signal });

  document.addEventListener('paste', (event) => {
    const incoming = (event.clipboardData?.getData('text') || '').normalize('NFKC').replace(/\D/g, '');
    if (!incoming) return;
    event.preventDefault();
    if (inputBlocked()) return;
    digits = digits.concat(incoming.slice(0, PIN_LENGTH - digits.length).split(''));
    render();
    if (digits.length === PIN_LENGTH) submit();
  }, { signal });

  if (blockedMessage) {
    announce(blockedMessage, 'error');
  } else if (lockedFor() > 0) {
    announce(`${MAX_FAILURES}回連続で一致しなかったため、入力を一時停止しています。`, 'error');
    startCountdown();
  } else {
    preload?.().catch(() => {
      if (!signal.aborted) announce(MESSAGES.loadError, 'error');
    });
  }
  render();

  return { destroy };
}
