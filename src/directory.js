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
const operatorPhrases = { gt: 'より大きい', gte: '以上', lt: 'より小さい', lte: '以下', eq: 'と等しい' };
const markLabels = { yellow: '黄色', green: '緑色' };
const CARD_ICONS = ['pin', 'calendar', 'users', 'coins', 'chart', 'arrowRight', 'grid', ...Object.values(CATEGORY_ICON_NAMES)];
const HERO_WAVE = `<svg class="hero-wave" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs><linearGradient id="heroWaveFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="hero-wave-stop-1"/><stop offset="1" class="hero-wave-stop-2"/></linearGradient></defs>
  <path class="hero-wave-fill" d="M250 0C360 110 470 220 640 232S780 190 800 150V0Z"/>
  <path class="hero-wave-line" vector-effect="non-scaling-stroke" d="M190 0C320 130 450 250 650 262S780 222 800 190"/>
  <path class="hero-wave-line is-faint" vector-effect="non-scaling-stroke" d="M330 0C430 90 520 170 680 180S780 150 800 118"/>
</svg>`;
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
          <span class="brand-logo" aria-hidden="true"><span>HN</span></span>
          <span class="brand-text"><small>発注ナビ</small><strong>企業ディレクトリ</strong></span>
        </a>
        <div class="topbar-actions">
          <span class="topbar-status"><span class="status-dot" aria-hidden="true"></span>2026.09 データ</span>
          ${themeToggleHtml()}
          <button type="button" class="lock-button" data-action="lock" aria-label="ロック">${icons.lock}<span>ロック</span></button>
        </div>
      </div>
    </header>
    <main class="page">
      <section class="hero" aria-labelledby="heroTitle">
        ${HERO_WAVE}
        <div class="hero-copy">
          <p class="eyebrow"><span class="eyebrow-mark" aria-hidden="true"></span>Company Directory</p>
          <h1 id="heroTitle">つくる会社を、<span>見つける。</span></h1>
          <p class="hero-lead">発注ナビに掲載された開発会社を、企業情報とカテゴリ別の実績から比較・探索できます。</p>
        </div>
        <dl class="kpis">
          <div class="kpi">
            <dt><span class="kpi-icon" aria-hidden="true">${icons.building}</span>掲載企業</dt>
            <dd class="kpi-value"><b data-kpi="companies">0</b><small>社</small></dd>
            <dd class="kpi-sub"><span class="kpi-sub-text">2026年9月時点の<wbr>データ</span></dd>
          </div>
          <div class="kpi">
            <dt><span class="kpi-icon" aria-hidden="true">${icons.chart}</span>実績<wbr>掲載企業</dt>
            <dd class="kpi-value"><b data-kpi="withPerformance">0</b><small>社</small></dd>
            <dd class="kpi-sub"><span class="kpi-bar" aria-hidden="true"><span data-kpi-bar></span></span><span class="kpi-sub-text" data-kpi="share">全体の 0%</span></dd>
          </div>
          <div class="kpi">
            <dt><span class="kpi-icon" aria-hidden="true">${icons.tag}</span>実績<wbr>カテゴリ</dt>
            <dd class="kpi-value"><b data-kpi="categories">0</b><small>種類</small></dd>
            <dd class="kpi-sub"><span class="kpi-sub-text" data-kpi="topCategory">—</span></dd>
          </div>
          <div class="kpi">
            <dt><span class="kpi-icon" aria-hidden="true">${icons.bookmark}</span>マーク<wbr>済み</dt>
            <dd class="kpi-value"><b data-kpi="marked">0</b><small>社</small></dd>
            <dd class="kpi-sub kpi-marks">
              <span class="kpi-mark" data-color="yellow"><i aria-hidden="true"></i>黄色<b data-kpi="yellow">0</b></span>
              <span class="kpi-mark" data-color="green"><i aria-hidden="true"></i>緑色<b data-kpi="green">0</b></span>
            </dd>
          </div>
        </dl>
      </section>

      <section class="filters" aria-labelledby="filtersTitle">
        <div class="filters-head">
          <h2 class="filters-title" id="filtersTitle"><span class="filters-title-icon" aria-hidden="true">${icons.filter}</span>検索と絞り込み</h2>
          <span class="filters-count" data-filter-count hidden></span>
          <button type="button" class="reset-button" data-action="reset" data-idle="true" aria-label="条件をリセット">${icons.reset}<span>条件をリセット</span></button>
        </div>
        <div class="filters-row filters-main">
          <div class="field field-search">
            ${icons.search}
            <label class="sr-only" for="directorySearch">キーワード検索</label>
            <input id="directorySearch" data-filter="search" type="search" autocomplete="off" enterkeyhint="search" placeholder="会社名・所在地・代表者で検索（スペースで複数語）">
            <kbd class="field-kbd" title="「/」キーで検索" aria-hidden="true">/</kbd>
            <button type="button" class="field-clear" data-action="clear-search" aria-label="キーワードを消去" hidden>${icons.xSmall}</button>
          </div>
          <label class="field">
            <span class="field-icon" aria-hidden="true">${icons.tag}</span>
            <span class="field-label">実績カテゴリ</span>
            <select data-filter="category"><option value="all">すべて</option></select>
          </label>
          <label class="field">
            <span class="field-icon" aria-hidden="true">${icons.sort}</span>
            <span class="field-label">並び順</span>
            <select data-filter="sort">${optionsHtml(sortOptions)}</select>
          </label>
        </div>
        <div class="filters-row filters-numeric">
          <span class="numeric-label" id="numericLabel"><span class="field-icon" aria-hidden="true">${icons.sliders}</span>数値条件</span>
          <div class="numeric-group" role="group" aria-labelledby="numericLabel">
            <select class="numeric-control" data-filter="metric" aria-label="項目"><option value="none">条件なし</option>${optionsHtml(Object.fromEntries(Object.entries(metricOptions).map(([key, option]) => [key, option.label])))}</select>
            <select class="numeric-control" data-filter="operator" aria-label="比較方法" disabled>${optionsHtml(operatorOptions)}</select>
            <label class="numeric-control numeric-input">
              <span class="sr-only">基準値</span>
              <input data-filter="threshold" type="number" min="0" step="1" inputmode="numeric" placeholder="値を入力" disabled>
              <span class="numeric-unit" data-unit aria-hidden="true">—</span>
            </label>
          </div>
        </div>
        <div class="filters-active" data-active-filters hidden></div>
      </section>

      <div class="results-bar">
        <p class="results-count" aria-live="polite"></p>
        <p class="results-hint">${icons.bookmark}色マークはこのブラウザに保存され、再読み込み後も保持されます</p>
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
  const searchField = $('.field-search');
  const searchClear = $('[data-action="clear-search"]');
  const activeFilters = $('[data-active-filters]');
  const filterCount = $('[data-filter-count]');
  const resetButton = $('.filters-head [data-action="reset"]');

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
    const set = (name, text) => { $(`[data-kpi="${name}"]`).textContent = text; };
    const withPerformance = companies.filter((company) => company.performance.length).length;
    const share = companies.length ? Math.round((withPerformance / companies.length) * 100) : 0;
    const categoryCounts = new Map();
    for (const company of companies) {
      for (const entry of company.performance) categoryCounts.set(entry.label, (categoryCounts.get(entry.label) || 0) + 1);
    }
    const [topLabel, topCount] = [...categoryCounts].sort((first, second) => second[1] - first[1])[0] || [];
    const barWidth = Math.max(share, 2);
    set('companies', integerFormat.format(companies.length));
    set('withPerformance', integerFormat.format(withPerformance));
    set('share', `全体の ${share}%`);
    $('[data-kpi-bar]').style.cssText = `--w:${barWidth}%;--bs:${(10000 / barWidth).toFixed(1)}%`;
    set('categories', integerFormat.format(categories.length));
    $('[data-kpi="topCategory"]').innerHTML = topLabel ? `最多：<wbr>${escapeHtml(topLabel)}<wbr>（${integerFormat.format(topCount)}社）` : '—';
    renderMarkCounts();
  }

  function renderMarkCounts() {
    const counts = { yellow: 0, green: 0 };
    for (const company of companies) {
      const mark = marks.get(company.source_url);
      if (mark) counts[mark] += 1;
    }
    for (const color of MARK_COLORS) $(`[data-kpi="${color}"]`).textContent = integerFormat.format(counts[color]);
    $('[data-kpi="marked"]').textContent = integerFormat.format(counts.yellow + counts.green);
  }

  function scheduleRender() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      applyFilters();
      renderGrid();
      renderFilterState();
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

  function activeConditions() {
    const items = [];
    const search = state.search.trim();
    if (search) items.push({ key: 'search', label: `キーワード「${search}」` });
    if (state.category !== 'all') items.push({ key: 'category', label: `カテゴリ：${state.category}` });
    if (state.metric !== 'none' && state.threshold !== '' && Number.isFinite(Number(state.threshold))) {
      const { label, unit } = metricOptions[state.metric];
      items.push({ key: 'numeric', label: `${label}が ${integerFormat.format(Number(state.threshold))}${unit} ${operatorPhrases[state.operator]}` });
    }
    if (state.sort !== 'source') items.push({ key: 'sort', label: `並び順：${sortOptions[state.sort]}` });
    return items;
  }

  function renderFilterState() {
    const items = activeConditions();
    searchClear.hidden = !state.search;
    searchField.classList.toggle('has-value', Boolean(state.search));
    filterCount.hidden = !items.length;
    filterCount.textContent = `${items.length}件の条件`;
    resetButton.dataset.idle = String(!items.length);
    activeFilters.hidden = !items.length;
    activeFilters.innerHTML = items.length
      ? `<span class="filters-active-label">適用中</span>${items.map((item) => `<button type="button" class="filter-chip" data-clear-filter="${item.key}" aria-label="${escapeHtml(item.label)} を解除"><span>${escapeHtml(item.label)}</span>${icons.xSmall}</button>`).join('')}`
      : '';
  }

  function clearFilter(key) {
    if (key === 'search') state.search = '';
    else if (key === 'category') state.category = 'all';
    else if (key === 'numeric') Object.assign(state, { metric: 'none', operator: 'gt', threshold: '' });
    else if (key === 'sort') state.sort = 'source';
    for (const [name, element] of Object.entries(controls)) element.value = state[name];
    syncNumericControls();
    scheduleRender();
    // The removed chip took focus with it; move focus to the control that owns the condition.
    ({ search: controls.search, category: controls.category, numeric: controls.metric, sort: controls.sort })[key]?.focus();
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
    const filterChip = event.target.closest('[data-clear-filter]');
    if (filterChip) {
      clearFilter(filterChip.dataset.clearFilter);
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'reset') resetFilters();
    else if (action === 'clear-search') clearFilter('search');
    else if (action === 'lock') onLock();
    else if (action === 'close') closeModal();
    else if (action === 'top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else if (event.target.matches('[data-backdrop]')) closeModal();
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal) {
      closeModal();
    } else if (event.key === 'Escape' && event.target === controls.search && state.search) {
      clearFilter('search');
    } else if (event.key === '/' && !modal && !event.metaKey && !event.ctrlKey && !event.altKey && !event.target.closest?.('input, textarea, select, [contenteditable="true"]')) {
      event.preventDefault();
      controls.search.focus();
    }
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
  renderFilterState();

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
