import './style.css';

const state = { companies: [], filtered: [], categories: [], search: '', category: 'all', metric: 'none', operator: 'gt', threshold: '', selected: null };
const app = document.querySelector('#app');
const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const metricOptions = { capital: { label: '資本金', hint: '円' }, employees: { label: '従業員数', hint: '名' }, projects: { label: '総実績件数', hint: '件' } };

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell); if (row.some((item) => item !== '')) rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.map((values) => headers.reduce((record, header, index) => {
    record[header] = decodeEntities(values[index] || ''); return record;
  }, {}));
}

function decodeEntities(value) { const area = document.createElement('textarea'); area.innerHTML = value; return area.value; }

function performanceFields(company) {
  return Object.entries(company).filter(([key, value]) => key.startsWith('performance_') && value).map(([key, value]) => ({ label: key.replace('performance_', ''), value: Number(value) })).sort((first, second) => second.value - first.value);
}

function numericValue(company, metric) {
  if (metric === 'capital') return Number((company.capital || '').replaceAll(',', '').replace(/[^0-9]/g, '')) || 0;
  if (metric === 'employees') return Number((company.employees || '').replaceAll(',', '').replace(/[^0-9]/g, '')) || 0;
  if (metric === 'projects') return performanceFields(company).reduce((total, record) => total + record.value, 0);
  return null;
}

function passesThreshold(company) {
  if (state.metric === 'none' || state.threshold === '') return true;
  const value = numericValue(company, state.metric);
  const target = Number(state.threshold);
  if (!Number.isFinite(target)) return true;
  if (state.operator === 'gt') return value > target;
  if (state.operator === 'lt') return value < target;
  return value === target;
}

function applyFilters() {
  const query = state.search.trim().toLowerCase();
  state.filtered = state.companies.filter((company) => {
    const matchesSearch = !query || [company.company_name, company.locations, company.representative].some((field) => field.toLowerCase().includes(query));
    const matchesCategory = state.category === 'all' || Boolean(company[`performance_${state.category}`]);
    return matchesSearch && matchesCategory && passesThreshold(company);
  });
}

function renderShell() {
  app.innerHTML = `
    <header class="topbar"><a class="brand" href="/" aria-label="発注ナビ企業ディレクトリ ホーム"><span class="brand-mark">HN</span><span>発注ナビ<br><strong>企業ディレクトリ</strong></span></a><div class="topbar-meta"><span class="status-dot"></span>公開データベース <span class="slash">/</span> 2026.09</div></header>
    <main><section class="hero"><div class="hero-copy"><p class="eyebrow">COMPANY INTELLIGENCE / 01</p><h1>つくる会社を、<br><em>見つける。</em></h1><p class="hero-description">発注ナビに掲載された開発会社の情報と実績を、ひとつの画面で比較・探索できます。</p></div><div class="hero-stamp"><span>DATASET</span><strong id="heroCount">--</strong><small>COMPANIES INDEXED</small></div></section>
    <section class="workspace" aria-label="企業一覧"><div class="section-intro"><div><p class="eyebrow">THE INDEX</p><h2>開発会社一覧</h2></div><p class="section-note">会社名を選ぶと、企業情報とカテゴリ別の実績を表示します。</p></div><div class="stats-row"><div><span>掲載企業</span><strong id="companyCount">--</strong></div><div><span>実績掲載企業</span><strong id="performanceCount">--</strong></div><div><span>対応カテゴリ</span><strong id="categoryCount">--</strong></div></div><div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="searchInput" type="search" placeholder="会社名・所在地・代表者で検索" /></label><label class="select-box"><span>実績カテゴリ</span><select id="categorySelect"><option value="all">すべてのカテゴリ</option></select></label><button class="reset-button rounded-md transition-colors duration-200" id="resetButton" type="button">リセット</button><div class="threshold-control rounded-md shadow-sm transition focus-within:ring-2 focus-within:ring-[#e77159]/20"><span class="font-medium">数値で絞り込む</span><select id="metricSelect" aria-label="数値項目"><option value="none">条件なし</option><option value="capital">資本金</option><option value="employees">従業員数</option><option value="projects">総実績件数</option></select><select id="operatorSelect" aria-label="比較演算子"><option value="gt">より大きい</option><option value="lt">より小さい</option><option value="eq">等しい</option></select><label class="threshold-input"><input id="thresholdInput" type="number" min="0" step="1" placeholder="数値を入力" /><span id="thresholdUnit">数値</span></label><span class="threshold-help">資本金は円、従業員数は名、総実績件数は件で判定します。</span></div></div><div class="results-line"><span id="resultsCount">--</span><span>社を表示中</span><span class="results-rule"></span><span class="sort-note">会社名順</span></div><div id="companyList" class="company-list"></div></section></main><div id="modalRoot"></div>`;
}

function renderStats() {
  const performanceCompanies = state.companies.filter((company) => performanceFields(company).length).length;
  document.querySelector('#heroCount').textContent = state.companies.length.toLocaleString('ja-JP');
  document.querySelector('#companyCount').textContent = state.companies.length.toLocaleString('ja-JP');
  document.querySelector('#performanceCount').textContent = performanceCompanies.toLocaleString('ja-JP');
  document.querySelector('#categoryCount').textContent = state.categories.length.toLocaleString('ja-JP');
}

function renderList() {
  const list = document.querySelector('#companyList');
  document.querySelector('#resultsCount').textContent = state.filtered.length.toLocaleString('ja-JP');
  if (!state.filtered.length) { list.innerHTML = '<div class="empty-state"><strong>該当する会社が見つかりません</strong><span>検索条件を変えて、もう一度お試しください。</span></div>'; return; }
  list.innerHTML = state.filtered.map((company, index) => {
    const records = performanceFields(company);
    return `<button class="company-row" type="button" data-url="${escapeHtml(company.source_url)}"><span class="row-index">${String(index + 1).padStart(3, '0')}</span><span class="company-name"><strong>${escapeHtml(company.company_name)}</strong><small>${escapeHtml(company.locations || '所在地情報なし')}</small></span><span class="row-tags">${records.slice(0, 3).map((record) => `<span>${escapeHtml(record.label)} <b>${record.value}</b></span>`).join('') || '<span class="muted">実績データなし</span>'}</span><span class="row-arrow" aria-hidden="true">↗</span></button>`;
  }).join('');
}

function renderModal(company) {
  const records = performanceFields(company); const max = records[0]?.value || 1;
  document.querySelector('#modalRoot').innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button class="modal-close" type="button" data-close-modal aria-label="閉じる">×</button><div class="modal-heading"><p class="eyebrow">COMPANY PROFILE</p><h2 id="modalTitle">${escapeHtml(company.company_name)}</h2><a href="${escapeHtml(company.homepage || company.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(company.homepage || '企業サイトを見る')} ↗</a></div><div class="modal-grid"><div class="info-panel"><p class="panel-kicker">企業情報</p><dl><div><dt>設立</dt><dd>${escapeHtml(company.established || '—')}</dd></div><div><dt>資本金</dt><dd>${escapeHtml(company.capital || '—')}</dd></div><div><dt>従業員数</dt><dd>${escapeHtml(company.employees || '—')}</dd></div><div><dt>代表者</dt><dd>${escapeHtml(company.representative || '—')}</dd></div><div><dt>所在地</dt><dd>${escapeHtml(company.locations || '—')}</dd></div></dl></div><div class="performance-panel"><div class="panel-title"><p class="panel-kicker">実績レコード</p><strong>${records.reduce((total, record) => total + record.value, 0)} <small>projects listed</small></strong></div>${records.length ? records.map((record) => `<div class="bar-row"><div><span>${escapeHtml(record.label)}</span><b>${record.value}</b></div><span class="bar-track"><span style="width: ${Math.max(7, (record.value / max) * 100)}%"></span></span></div>`).join('') : '<p class="no-records">この会社のカテゴリ別実績は掲載されていません。</p>'}</div></div><footer class="modal-footer"><span>Source: 発注ナビ企業情報</span><a href="${escapeHtml(company.source_url)}" target="_blank" rel="noreferrer">掲載ページを開く ↗</a></footer></section></div>`;
}

function bindEvents() {
  document.querySelector('#searchInput').addEventListener('input', (event) => { state.search = event.target.value; applyFilters(); renderList(); });
  document.querySelector('#categorySelect').addEventListener('change', (event) => { state.category = event.target.value; applyFilters(); renderList(); });
  document.querySelector('#metricSelect').addEventListener('change', (event) => { state.metric = event.target.value; document.querySelector('#thresholdUnit').textContent = state.metric === 'none' ? '数値' : metricOptions[state.metric].hint; applyFilters(); renderList(); });
  document.querySelector('#operatorSelect').addEventListener('change', (event) => { state.operator = event.target.value; applyFilters(); renderList(); });
  document.querySelector('#thresholdInput').addEventListener('input', (event) => { state.threshold = event.target.value; applyFilters(); renderList(); });
  document.querySelector('#resetButton').addEventListener('click', () => { state.search = ''; state.category = 'all'; state.metric = 'none'; state.operator = 'gt'; state.threshold = ''; document.querySelector('#searchInput').value = ''; document.querySelector('#categorySelect').value = 'all'; document.querySelector('#metricSelect').value = 'none'; document.querySelector('#operatorSelect').value = 'gt'; document.querySelector('#thresholdInput').value = ''; document.querySelector('#thresholdUnit').textContent = '数値'; applyFilters(); renderList(); });
  document.querySelector('#companyList').addEventListener('click', (event) => { const row = event.target.closest('[data-url]'); if (!row) return; state.selected = state.companies.find((company) => company.source_url === row.dataset.url); renderModal(state.selected); });
  document.querySelector('#modalRoot').addEventListener('click', (event) => { if (event.target.matches('[data-close-modal]')) { document.querySelector('#modalRoot').innerHTML = ''; state.selected = null; } });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && state.selected) { document.querySelector('#modalRoot').innerHTML = ''; state.selected = null; } });
}

async function init() {
  renderShell();
  try {
    const response = await fetch('/data/hnavi_companies_merged.csv'); if (!response.ok) throw new Error('CSV could not be loaded');
    state.companies = parseCsv(await response.text());
    state.categories = [...new Set(state.companies.flatMap((company) => performanceFields(company).map((record) => record.label)))].sort();
    document.querySelector('#categorySelect').insertAdjacentHTML('beforeend', state.categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(''));
    applyFilters(); renderStats(); renderList(); bindEvents();
  } catch (error) { document.querySelector('#companyList').innerHTML = '<div class="empty-state"><strong>データを読み込めませんでした</strong><span>CSVファイルの配置を確認してください。</span></div>'; console.error(error); }
}

init();