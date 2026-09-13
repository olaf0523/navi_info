import { CATEGORY_ICON_NAMES, categoryIconName, iconSprite, icons, useIcon } from './icons.js';
import { createMarkStore, MARK_COLORS } from './marks.js';
import { enhanceModal, modalHtml } from './modal.js';
import { themeToggleHtml } from './theme.js';
import { escapeHtml, integerFormat, monogram } from './utils.js';

const metricOptions = {
  capital: { label: '資本金', unit: '円' },
  employees: { label: '従業員数', unit: '名' },
  projects: { label: '総実績件数', unit: '件' },
};
const sortOptions = {
  source: '掲載順',
  projects: '実績件数が多い順',
  employees: '従業員数が多い順',
  capital: '資本金が大きい順',
};
const operatorOptions = { gt: 'より大きい', gte: '以上', lt: 'より小さい', lte: '以下', eq: '等しい' };
const markLabels = { yellow: '黄色', green: '緑色' };
const CARD_ICONS = ['pin', 'calendar', 'users', 'coins', 'chart', 'arrowRight', 'grid', ...Object.values(CATEGORY_ICON_NAMES)];
const FIRST_BATCH = 36;
const BATCH = 120;
const defaultFilters = { search: '', category: 'all', sort: 'source', metric: 'none', operator: 'gt', threshold: '' };

const decimalFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });

const normalize = (value) => value.normalize('NFKC').toLowerCase();

function decodeEntities(value) {
  if (!value.includes('&')) return value;
  const area = document.createElement('textarea');
  area.innerHTML = value;
  return area.value;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((item) => item !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, '') : header));
  const records = rows.map((values) => headers.reduce((record, header, index) => {
    record[header] = decodeEntities(values[index] || '');
    return record;
  }, {}));
  return { headers, records };
}

function toNumber(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  return digits ? Number(digits) : null;
}

function formatCapital(value) {
  if (value === null) return '—';
  if (value >= 1e8) return `${decimalFormat.format(value / 1e8)}億円`;
  if (value >= 1e4) return `${decimalFormat.format(value / 1e4)}万円`;
  return `${integerFormat.format(value)}円`;
}

function prepareCompanies(records) {
  return records.filter((record) => record.company_name).map((record, id) => {
    const performance = Object.entries(record)
      .filter(([key, value]) => key.startsWith('performance_') && value)
      .map(([key, value]) => ({ label: key.slice('performance_'.length), value: Number(value) }))
      .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
      .sort((first, second) => second.value - first.value);
    return {
      ...record,
      id,
      performance,
      projectTotal: performance.reduce((total, entry) => total + entry.value, 0),
      capitalValue: toNumber(record.capital),
      employeeValue: toNumber(record.employees),
      establishedYear: record.established.match(/^(\d{4})年/)?.[1] || '',
      searchText: normalize([record.company_name, record.locations, record.representative].join('\n')),
    };
  });
}

function metricValue(company, metric) {
  if (metric === 'capital') return company.capitalValue;
  if (metric === 'employees') return company.employeeValue;
  if (metric === 'projects') return company.projectTotal;
  return null;
}

function compare(value, operator, target) {
  if (operator === 'gt') return value > target;
  if (operator === 'gte') return value >= target;
  if (operator === 'lt') return value < target;
  if (operator === 'lte') return value <= target;
  return value === target;
}

const optionsHtml = (options) => Object.entries(options).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');

function shellHtml() {
  return `<div class="app-shell">
    ${iconSprite(CARD_ICONS)}
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="発注ナビ企業ディレクトリ ホーム">
          <span class="brand-mark" aria-hidden="true">HN</span>
          <span class="brand-text"><small>発注ナビ</small><strong>企業ディレクトリ</strong></span>
        </a>
        <div class="topbar-actions">
          <span class="topbar-meta"><span class="status-dot" aria-hidden="true"></span>2026.09 データ</span>
          ${themeToggleHtml()}
          <button type="button" class="lock-button" data-action="lock" aria-label="ロック">${icons.lock}<span>ロック</span></button>
        </div>
      </div>
    </header>
    <main class="page">
      <section class="intro">
        <div class="intro-copy">
          <p class="eyebrow">Company Directory</p>
          <h1>つくる会社を、<span>見つける。</span></h1>
          <p class="intro-lead">発注ナビに掲載された開発会社を、企業情報とカテゴリ別の実績から比較・探索できます。</p>
        </div>
        <dl class="kpis">
          <div class="kpi"><dt>掲載企業</dt><dd data-kpi="companies">0</dd></div>
          <div class="kpi"><dt>実績掲載企業</dt><dd data-kpi="withPerformance">0</dd></div>
          <div class="kpi"><dt>実績カテゴリ</dt><dd data-kpi="categories">0</dd></div>
          <div class="kpi"><dt>マーク済み</dt><dd class="kpi-marks">
            <span class="kpi-mark" data-color="yellow" title="黄色"><i aria-hidden="true"></i><span class="sr-only">黄色</span><b data-kpi="yellow">0</b></span>
            <span class="kpi-mark" data-color="green" title="緑色"><i aria-hidden="true"></i><span class="sr-only">緑色</span><b data-kpi="green">0</b></span>
          </dd></div>
        </dl>
      </section>

      <section class="filters" aria-label="検索と絞り込み">
        <div class="filters-row filters-main">
          <label class="field field-search">
            ${icons.search}<span class="sr-only">キーワード検索</span>
            <input data-filter="search" type="search" autocomplete="off" enterkeyhint="search" placeholder="会社名・所在地・代表者で検索（スペースで複数語）">
          </label>
          <label class="field">
            <span class="field-label">実績カテゴリ</span>
            <select data-filter="category"><option value="all">すべて</option></select>
          </label>
          <label class="field">
            <span class="field-label">並び順</span>
            <select data-filter="sort">${optionsHtml(sortOptions)}</select>
          </label>
        </div>
        <div class="filters-row filters-numeric">
          <span class="field-label" id="numericLabel">数値条件</span>
          <div class="numeric-group" role="group" aria-labelledby="numericLabel">
            <select class="numeric-control" data-filter="metric" aria-label="項目"><option value="none">条件なし</option>${optionsHtml(Object.fromEntries(Object.entries(metricOptions).map(([key, option]) => [key, option.label])))}</select>
            <select class="numeric-control" data-filter="operator" aria-label="比較方法" disabled>${optionsHtml(operatorOptions)}</select>
            <label class="numeric-control numeric-input">
              <span class="sr-only">基準値</span>
              <input data-filter="threshold" type="number" min="0" step="1" inputmode="numeric" placeholder="値を入力" disabled>
              <span class="numeric-unit" data-unit aria-hidden="true">—</span>
            </label>
          </div>
          <button type="button" class="reset-button" data-action="reset">${icons.reset}<span>条件をリセット</span></button>
        </div>
      </section>

      <div class="results-bar">
        <p class="results-count" aria-live="polite"></p>
        <p class="results-hint">色マークはこのブラウザに保存され、再読み込み後も保持されます</p>
      </div>
      <div class="company-grid" data-grid></div>
    </main>
    <footer class="site-footer">Source: 発注ナビ 企業情報 / 2026.09</footer>
    <button type="button" class="to-top" data-action="top" aria-label="ページの先頭へ戻る" hidden>${icons.arrowUp}</button>
  </div>
  <div data-modal-root></div>`;
}

export function mountDirectory(root, { csv, onLock }) {
  const controller = new AbortController();
  const { signal } = controller;
  const marks = createMarkStore();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { ...defaultFilters };
  let companies = [];
  let categories = [];
  let filtered = [];
  let modal = null;
  let frame = 0;
  let renderToken = 0;

  root.innerHTML = shellHtml();
  const $ = (selector) => root.querySelector(selector);
  const shell = $('.app-shell');
  const grid = $('[data-grid]');
  const modalRoot = $('[data-modal-root]');
  const resultsCount = $('.results-count');
  const toTop = $('[data-action="top"]');
  const controls = Object.fromEntries([...root.querySelectorAll('[data-filter]')].map((element) => [element.dataset.filter, element]));

  try {
    const { headers, records } = parseCsv(csv);
    companies = prepareCompanies(records);
    const present = new Set(companies.flatMap((company) => company.performance.map((entry) => entry.label)));
    categories = headers.filter((header) => header.startsWith('performance_')).map((header) => header.slice('performance_'.length)).filter((label) => present.has(label));
  } catch (error) {
    console.error(error);
  }

  controls.category.insertAdjacentHTML('beforeend', categories.map((label) => `<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`).join(''));

  function markPickerHtml(company, groupName) {
    const mark = marks.get(company.source_url);
    const options = MARK_COLORS.map((color) => `<label class="mark-option" data-color="${color}">
        <input type="radio" name="${groupName}" value="${color}" data-mark-input="${company.id}"${mark === color ? ' checked' : ''}>
        <span class="mark-swatch" aria-hidden="true"></span><span>${markLabels[color]}</span>
      </label>`).join('');
    return `<fieldset class="mark-picker">
      <legend class="sr-only">${escapeHtml(company.company_name)} の背景色</legend>
      ${options}
      <button type="button" class="mark-clear" data-mark-clear="${company.id}"${mark ? '' : ' disabled'}>選択を解除</button>
    </fieldset>`;
  }

  function cardHtml(company, position) {
    const mark = marks.get(company.source_url) || '';
    const top = company.performance.slice(0, 3);
    const hiddenCount = company.performance.length - top.length;
    const max = top[0]?.value || 1;
    const perf = top.length
      ? `<ul class="perf-list">${top.map((entry) => {
          const width = Math.max(5, (entry.value / max) * 100);
          return `<li>
            <span class="perf-icon" aria-hidden="true">${useIcon(categoryIconName(entry.label), 16)}</span>
            <div class="perf-body">
              <div class="perf-top"><span class="perf-label">${escapeHtml(entry.label)}</span><b>${integerFormat.format(entry.value)}<small>件</small></b></div>
              <span class="perf-bar" aria-hidden="true"><span style="--w:${width.toFixed(1)}%;--bs:${(10000 / width).toFixed(1)}%"></span></span>
            </div>
          </li>`;
        }).join('')}</ul>${hiddenCount ? `<p class="perf-more">ほか ${hiddenCount} カテゴリ</p>` : ''}`
      : `<p class="perf-empty"><span class="perf-empty-icon" aria-hidden="true">${useIcon('chart', 16)}</span>カテゴリ別の実績は未掲載です</p>`;

    return `<article class="card" data-company="${company.id}" data-mark="${mark}">
      <div class="card-head">
        <span class="card-logo" aria-hidden="true"><span>${escapeHtml(monogram(company.company_name))}</span></span>
        <div class="card-heading">
          <span class="card-no">No.${String(position + 1).padStart(3, '0')}</span>
          <h3 class="card-title"><button type="button" class="card-open" data-open="${company.id}"><span class="card-name">${escapeHtml(company.company_name)}</span></button></h3>
          <p class="card-location" title="${escapeHtml(company.locations)}">${useIcon('pin', 13)}<span>${escapeHtml(company.locations || '所在地情報なし')}</span></p>
        </div>
      </div>
      <dl class="card-facts">
        <div><dt>${useIcon('calendar', 14)}設立</dt><dd>${company.establishedYear ? `${company.establishedYear}年` : '—'}</dd></div>
        <div><dt>${useIcon('users', 14)}従業員</dt><dd>${escapeHtml(company.employees || '—')}</dd></div>
        <div><dt>${useIcon('coins', 14)}資本金</dt><dd>${formatCapital(company.capitalValue)}</dd></div>
      </dl>
      <div class="card-perf">
        <div class="card-perf-head">
          <span class="card-perf-title">${useIcon('chart', 15)}カテゴリ別実績</span>
          <span class="card-total${company.projectTotal ? '' : ' is-empty'}"><b>${integerFormat.format(company.projectTotal)}</b>件</span>
        </div>
        <div class="card-perf-body">${perf}</div>
      </div>
      <div class="card-foot">
        ${markPickerHtml(company, `mark-card-${company.id}`)}
        <span class="card-more" aria-hidden="true">詳細${useIcon('arrowRight', 14)}</span>
      </div>
    </article>`.replace(/\n\s*/g, ''); // Drop template indentation: 964 cards are re-rendered on every filter change.
  }

  function applyFilters() {
    const terms = normalize(state.search).split(/\s+/).filter(Boolean);
    const target = state.threshold === '' ? NaN : Number(state.threshold);
    const numericActive = state.metric !== 'none' && Number.isFinite(target);

    const result = companies.filter((company) => {
      if (terms.length && !terms.every((term) => company.searchText.includes(term))) return false;
      if (state.category !== 'all' && !company.performance.some((entry) => entry.label === state.category)) return false;
      if (numericActive) {
        const value = metricValue(company, state.metric);
        if (value === null || !compare(value, state.operator, target)) return false;
      }
      return true;
    });

    if (state.sort !== 'source') {
      result.sort((first, second) => {
        const a = metricValue(first, state.sort);
        const b = metricValue(second, state.sort);
        if (a === b) return first.id - second.id;
        if (a === null) return 1;
        if (b === null) return -1;
        return b - a;
      });
    }
    filtered = result;
  }

  function renderGrid() {
    const token = ++renderToken;
    resultsCount.innerHTML = `<b>${integerFormat.format(filtered.length)}</b> 社を表示中<span> / 全 ${integerFormat.format(companies.length)} 社</span>`;
    if (!companies.length) {
      grid.innerHTML = '<div class="empty-state"><strong>データを表示できませんでした</strong><p>企業データの形式を確認してください。</p></div>';
      return;
    }
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state"><strong>条件に一致する会社はありません</strong><p>キーワードや数値条件を見直してください。</p><button type="button" class="lock-button" data-action="reset">${icons.reset}<span>条件をリセット</span></button></div>`;
      return;
    }
    // First batch paints immediately; the rest is appended in small batches so typing and scrolling stay responsive.
    const list = filtered;
    let offset = Math.min(FIRST_BATCH, list.length);
    grid.innerHTML = list.slice(0, offset).map(cardHtml).join('');
    const appendBatch = () => {
      if (token !== renderToken || offset >= list.length) return;
      const end = Math.min(offset + BATCH, list.length);
      grid.insertAdjacentHTML('beforeend', list.slice(offset, end).map((company, index) => cardHtml(company, offset + index)).join(''));
      offset = end;
      setTimeout(appendBatch, 0);
    };
    setTimeout(appendBatch, 0);
  }

  function renderKpis() {
    const set = (name, value) => { $(`[data-kpi="${name}"]`).textContent = integerFormat.format(value); };
    set('companies', companies.length);
    set('withPerformance', companies.filter((company) => company.performance.length).length);
    set('categories', categories.length);
    renderMarkCounts();
  }

  function renderMarkCounts() {
    const counts = { yellow: 0, green: 0 };
    for (const company of companies) {
      const mark = marks.get(company.source_url);
      if (mark) counts[mark] += 1;
    }
    for (const color of MARK_COLORS) $(`[data-kpi="${color}"]`).textContent = integerFormat.format(counts[color]);
  }

  function scheduleRender() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      applyFilters();
      renderGrid();
    });
  }

  // Updates every rendered view of a company (card and open modal) without re-rendering the grid.
  function syncMark(company) {
    const mark = marks.get(company.source_url);
    for (const element of root.querySelectorAll(`[data-company="${company.id}"]`)) {
      element.dataset.mark = mark || '';
      for (const input of element.querySelectorAll('[data-mark-input]')) input.checked = input.value === mark;
      const clearButton = element.querySelector('[data-mark-clear]');
      if (clearButton) clearButton.disabled = !mark;
    }
  }

  function syncAllMarks() {
    for (const element of root.querySelectorAll('[data-company]')) syncMark(companies[Number(element.dataset.company)]);
    renderMarkCounts();
  }

  function syncNumericControls() {
    const inactive = state.metric === 'none';
    controls.operator.disabled = inactive;
    controls.threshold.disabled = inactive;
    $('[data-unit]').textContent = inactive ? '—' : metricOptions[state.metric].unit;
  }

  function resetFilters() {
    Object.assign(state, defaultFilters);
    for (const [name, element] of Object.entries(controls)) element.value = state[name];
    syncNumericControls();
    scheduleRender();
  }

  function openModal(company, opener) {
    modalRoot.innerHTML = modalHtml(company, { mark: marks.get(company.source_url), markPicker: markPickerHtml(company, 'mark-modal') });
    modal = { company, opener, cleanup: enhanceModal(modalRoot.querySelector('.modal')) };
    shell.inert = true;
    document.documentElement.classList.add('is-modal-open');
    modalRoot.querySelector('.modal-close').focus();
  }

  function closeModal() {
    if (!modal) return;
    const { opener, cleanup } = modal;
    cleanup();
    modal = null;
    modalRoot.innerHTML = '';
    shell.inert = false;
    document.documentElement.classList.remove('is-modal-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  for (const [name, element] of Object.entries(controls)) {
    const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      state[name] = element.value;
      if (name === 'metric') syncNumericControls();
      scheduleRender();
    }, { signal });
  }

  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-mark-input]');
    if (!input) return;
    const company = companies[Number(input.dataset.markInput)];
    marks.set(company.source_url, input.value);
    syncMark(company);
    renderMarkCounts();
  }, { signal });

  root.addEventListener('click', (event) => {
    const clearButton = event.target.closest('[data-mark-clear]');
    if (clearButton) {
      const company = companies[Number(clearButton.dataset.markClear)];
      const picker = clearButton.closest('.mark-picker');
      marks.set(company.source_url, null);
      syncMark(company);
      renderMarkCounts();
      picker.querySelector('input').focus();
      return;
    }
    const opener = event.target.closest('[data-open]');
    if (opener) {
      openModal(companies[Number(opener.dataset.open)], opener);
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'reset') resetFilters();
    else if (action === 'lock') onLock();
    else if (action === 'close') closeModal();
    else if (action === 'top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else if (event.target.matches('[data-backdrop]')) closeModal();
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal) closeModal();
  }, { signal });

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === marks.storageKey) {
      marks.reload();
      syncAllMarks();
    }
  }, { signal });

  window.addEventListener('scroll', () => {
    toTop.hidden = window.scrollY < 900;
  }, { signal, passive: true });

  applyFilters();
  renderKpis();
  renderGrid();

  return {
    destroy() {
      modal?.cleanup();
      controller.abort();
      cancelAnimationFrame(frame);
      renderToken += 1;
      document.documentElement.classList.remove('is-modal-open');
      root.innerHTML = '';
    },
  };
}
