// Company profile modal: markup plus the section navigation behaviour.
import { categoryIconName, icons } from './icons.js';
import { escapeHtml, integerFormat, monogram, safeUrl } from './utils.js';

const SECTIONS = [
  { id: 'overview', label: '概要', icon: icons.home },
  { id: 'info', label: '企業情報', icon: icons.building },
  { id: 'performance', label: '実績', icon: icons.chart },
  { id: 'location', label: '所在地', icon: icons.mapPin },
  { id: 'categories', label: '対応カテゴリ', icon: icons.tag },
];

const WAVE_SVG = `<svg class="pm-wave" viewBox="0 0 640 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs><linearGradient id="pmWaveFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="pm-wave-stop-1"/><stop offset="1" class="pm-wave-stop-2"/></linearGradient></defs>
  <path class="pm-wave-fill" d="M150 0C255 72 330 142 462 152S620 122 640 92V0Z"/>
  <path class="pm-wave-line" vector-effect="non-scaling-stroke" d="M112 0C226 82 318 164 470 172S612 142 640 120"/>
  <path class="pm-wave-line is-faint" vector-effect="non-scaling-stroke" d="M214 0C298 52 378 112 500 120S620 98 640 74"/>
</svg>`;

// Decorative street pattern; the real location opens in Google Maps.
const MAP_SVG = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect class="pm-map-land" width="320" height="200"/>
  <g class="pm-map-blocks">
    <path d="M0 0h66l-10 54H0Z"/><path d="M90 0h86l-8 44H80Z"/><path d="M198 0h122v50H192Z"/>
    <path d="M0 80h46l-9 58H0Z"/><path d="M72 72h86l-6 50H62Z"/><path d="M184 76h62l-4 48h-64Z"/><path d="M272 76h48v68h-54Z"/>
    <path d="M0 166h32l-5 34H0Z"/><path d="M56 150h92l-4 50H50Z"/><path d="M172 152h80l-2 48h-82Z"/><path d="M278 170h42v30h-44Z"/>
  </g>
  <g class="pm-map-roads-minor"><path d="M-10 108 330 98"/><path d="M122-10 110 210"/><path d="M-10 24 330 32"/><path d="M226-10 216 210"/></g>
  <g class="pm-map-roads"><path d="M-10 66C90 58 200 72 330 62"/><path d="M-10 146C100 138 220 148 330 160"/><path d="M76-10 46 210"/><path d="M188-10 164 210"/><path d="M262-10 270 210"/></g>
  <circle class="pm-map-pulse" cx="150" cy="120" r="12"/>
  <path class="pm-map-pin" d="M150 122c-9.5-12.5-15.5-20.5-15.5-29a15.5 15.5 0 0 1 31 0c0 8.5-6 16.5-15.5 29Z"/>
  <circle class="pm-map-pin-dot" cx="150" cy="93" r="5.5"/>
</svg>`;

const mapsUrl = (address) =>
  (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/^海外\s+/, ''))}` : '');

const emptyState = (icon, title, text) =>
  `<div class="pm-empty"><span class="pm-empty-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><span>${text}</span></div>`;

function performanceHtml(company) {
  if (!company.performance.length) {
    return emptyState(icons.chart, 'カテゴリ別の実績は未掲載です', '発注ナビに実績が掲載されると、ここに表示されます。');
  }
  const max = company.performance[0].value;
  return `<ul class="pm-perf-list">${company.performance.map((entry) => {
    const width = Math.max(4, (entry.value / max) * 100);
    // Each bar shows the matching slice of one full-width gradient.
    return `<li class="pm-perf-item">
      <span class="pm-perf-icon" aria-hidden="true">${icons[categoryIconName(entry.label)]}</span>
      <div class="pm-perf-body">
        <div class="pm-perf-top"><span>${escapeHtml(entry.label)}</span><b>${integerFormat.format(entry.value)}<small>件</small></b></div>
        <span class="pm-bar" aria-hidden="true"><span style="--w:${width.toFixed(1)}%;--bs:${(10000 / width).toFixed(1)}%"></span></span>
      </div>
    </li>`;
  }).join('')}</ul>`;
}

function categoriesHtml(company) {
  if (!company.performance.length) {
    return emptyState(icons.tag, '対応カテゴリの情報はありません', '実績の掲載に合わせて自動で表示されます。');
  }
  return `<ul class="pm-chips">${company.performance.map((entry, index) =>
    `<li class="pm-chip" data-tone="${(index % 4) + 1}">${icons[categoryIconName(entry.label)]}<span>${escapeHtml(entry.label)}</span></li>`).join('')}</ul>`;
}

export function modalHtml(company, { mark, markPicker }) {
  const homepage = safeUrl(company.homepage);
  const source = safeUrl(company.source_url);
  const address = company.locations;
  const map = mapsUrl(address);
  const rows = [
    [icons.calendar, '設立', company.established],
    [icons.coins, '資本金', company.capital],
    [icons.users, '従業員数', company.employees],
    [icons.user, '代表者', company.representative],
    [icons.mapPin, '所在地', address],
  ];

  return `<div class="modal-backdrop" data-backdrop>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" data-company="${company.id}" data-mark="${mark || ''}">
      <aside class="pm-rail">
        <div class="pm-logo" aria-hidden="true"><span>${escapeHtml(monogram(company.company_name))}</span></div>
        <nav class="pm-nav" aria-label="プロフィールの項目">
          ${SECTIONS.map((section, index) => `<button type="button" class="pm-nav-item" data-section-link="${section.id}"${index === 0 ? ' aria-current="true"' : ''}>${section.icon}<span>${section.label}</span></button>`).join('')}
        </nav>
        <p class="pm-rail-foot">HNAVI<br>PROFILE</p>
      </aside>

      <div class="pm-main">
        <header class="pm-header" data-section="overview">
          ${WAVE_SVG}
          <div class="pm-heading">
            <div class="pm-eyebrow-row">
              <p class="pm-eyebrow">Company Profile</p>
              <span class="pm-mark-badge"><span data-for="yellow">黄色でマーク中</span><span data-for="green">緑色でマーク中</span></span>
            </div>
            <h2 id="modalTitle">${escapeHtml(company.company_name)}</h2>
            ${homepage
              ? `<a class="pm-link" href="${escapeHtml(homepage)}" target="_blank" rel="noopener noreferrer">${icons.link}<span>${escapeHtml(homepage)}</span>${icons.arrowUpRight}</a>`
              : `<p class="pm-link is-empty">${icons.link}<span>企業サイトは未掲載です</span></p>`}
          </div>
          <button type="button" class="modal-close" data-action="close" aria-label="閉じる">${icons.close}</button>
        </header>

        <div class="pm-body" data-modal-body>
          <div class="pm-grid">
            <section class="pm-card pm-info" data-section="info" aria-labelledby="pmInfoTitle">
              <div class="pm-card-head"><h3 class="pm-card-title" id="pmInfoTitle">${icons.building}企業情報</h3></div>
              <dl class="pm-info-list">
                ${rows.map(([icon, label, value]) => `<div><dt>${icon}<span>${label}</span></dt><dd>${escapeHtml(value || '—')}</dd></div>`).join('')}
              </dl>
            </section>

            <section class="pm-card pm-perf" data-section="performance" aria-labelledby="pmPerfTitle">
              <div class="pm-card-head">
                <h3 class="pm-card-title" id="pmPerfTitle">${icons.chart}カテゴリ別実績</h3>
                <span class="pm-count"><b>${integerFormat.format(company.projectTotal)}</b>件</span>
              </div>
              ${performanceHtml(company)}
            </section>

            <section class="pm-card pm-location" data-section="location" aria-labelledby="pmMapTitle">
              <div class="pm-card-head"><h3 class="pm-card-title" id="pmMapTitle">${icons.mapPin}所在地マップ</h3></div>
              <div class="pm-location-body">
                <div class="pm-map">${MAP_SVG}<span class="pm-map-tag">イメージ</span></div>
                <div class="pm-location-text">
                  <p class="pm-address">${escapeHtml(address || '所在地情報は未掲載です')}</p>
                  ${map ? `<a class="pm-button" href="${escapeHtml(map)}" target="_blank" rel="noopener noreferrer">${icons.map}<span>Googleマップで見る</span>${icons.arrowUpRight}</a>` : ''}
                </div>
              </div>
            </section>

            <section class="pm-card pm-cats" data-section="categories" aria-labelledby="pmCatsTitle">
              <div class="pm-card-head"><h3 class="pm-card-title" id="pmCatsTitle">${icons.tag}主な対応カテゴリ</h3></div>
              ${categoriesHtml(company)}
            </section>
          </div>
        </div>

        <footer class="pm-footer">
          ${markPicker}
          ${source ? `<a class="pm-source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">${icons.external}<span>発注ナビの掲載ページ</span>${icons.arrowUpRight}</a>` : ''}
        </footer>
      </div>
    </section>
  </div>`;
}

// Wires the side navigation (click-to-scroll + scroll spy). Returns a cleanup function.
export function enhanceModal(modal) {
  const body = modal.querySelector('[data-modal-body]');
  const links = [...modal.querySelectorAll('[data-section-link]')];
  const sections = [...modal.querySelectorAll('[data-section]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let spyPausedUntil = 0;
  let frame = 0;
  let spotlightTimer = 0;

  const setCurrent = (id) => {
    for (const link of links) {
      if (link.dataset.sectionLink === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };

  const onNavClick = (event) => {
    const link = event.target.closest('[data-section-link]');
    if (!link) return;
    const id = link.dataset.sectionLink;
    const behavior = reduceMotion ? 'auto' : 'smooth';
    setCurrent(id);
    spyPausedUntil = performance.now() + 800;
    if (id === 'overview') {
      body.scrollTo({ top: 0, behavior });
      return;
    }
    const target = modal.querySelector(`[data-section="${id}"]`);
    const top = target.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 16;
    body.scrollTo({ top: Math.max(0, top), behavior });
    target.classList.remove('is-spotlit');
    void target.offsetWidth; // Restart the highlight animation on repeated clicks.
    target.classList.add('is-spotlit');
    clearTimeout(spotlightTimer);
    spotlightTimer = setTimeout(() => target.classList.remove('is-spotlit'), 1300);
  };

  const onScroll = () => {
    if (performance.now() < spyPausedUntil) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (body.scrollTop < 8) return setCurrent('overview');
      if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) return setCurrent(sections.at(-1).dataset.section);
      const limit = body.getBoundingClientRect().top + 48;
      let current = 'overview';
      for (const section of sections) if (section.getBoundingClientRect().top <= limit) current = section.dataset.section;
      setCurrent(current);
    });
  };

  modal.querySelector('.pm-nav').addEventListener('click', onNavClick);
  body.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    modal.querySelector('.pm-nav')?.removeEventListener('click', onNavClick);
    body.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
    clearTimeout(spotlightTimer);
  };
}
