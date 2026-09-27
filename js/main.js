// App shell (top nav on desktop, bottom nav on phones) + hash router. Routes:
//   #/                  home dashboard
//   #/flashcards        topic list for flashcards (of the chosen level)
//   #/read              topic list for read-aloud (of the chosen level)
//   #/ipa               IPA chart + minimal pairs
//   #/flashcards/<key>  one topic's deck (the key says which level it's in)
//   #/read/<key>        one topic's passage
// Hash routes keep the phone's Back button working and each screen linkable.
import { loadIpa, loadLevel, levelOf, getLevel, setLevel, LEVELS, levelInfo, knownCount, passageScore, importFromHash } from './store.js';
import { stopSpeaking } from './speech.js';
import { closeSheet, sheetOpen, esc, toast, cheer, bindArtFallbacks } from './ui.js';
import { renderHome } from './home.js';
import { renderFlashcards } from './flashcards.js';
import { renderReading } from './reading.js';
import { renderIpa } from './ipa.js';

const app = document.getElementById('app');
let ipa = null;
let active = null; // { onKey } of the current screen
let routeId = 0;   // a newer route() wins if an older one is still loading

const NAV = [
  { id: '', icon: '🏠', label: 'Trang chủ' },
  { id: 'flashcards', icon: '📚', label: 'Từ vựng' },
  { id: 'read', icon: '📖', label: 'Luyện đọc' },
  { id: 'ipa', icon: '🔤', label: 'Phát âm IPA' },
];
const PAGES = {
  flashcards: { title: 'Từ vựng', hint: 'Chọn trình độ, rồi chọn chủ đề để học từ vựng qua thẻ nhớ hai mặt và luyện phát âm từng từ.' },
  read: { title: 'Luyện đọc', hint: 'Chọn trình độ, rồi đọc to đoạn văn chứa từ đã học. Máy tô xanh từ nghe đúng, đỏ từ bị sót.' },
  ipa: { title: 'Phát âm IPA', hint: 'Chạm vào một âm để nghe ví dụ và tự nói thử.' },
};

function renderShell() {
  const links = NAV.map(n => `<a class="nav-link" href="#/${n.id}" data-ui="nav" data-nav="${n.id}"><span class="nav-ico" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<header class="topnav"><div class="topnav-inner">
      <a class="brand" href="#/"><span class="brand-mark" aria-hidden="true">🌱</span><span><span class="brand-name">IELTS Vocab &amp; Speaking</span><br><span class="brand-tag">Mỗi ngày một chút, tiến bộ thật nhiều</span></span></a>
      <nav class="nav-links" aria-label="Điều hướng chính">${links}</nav></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `<nav class="bottomnav" aria-label="Điều hướng chính">${links}</nav>`);
}
function markNav(section) {
  document.querySelectorAll('[data-ui="nav"]').forEach(a => {
    if (a.dataset.nav === section) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

function topicCardHtml(t, tab, passages) {
  let count, label, pct;
  if (tab === 'read') {
    const n = passages[t.key].sentences.length;
    pct = Math.round(passageScore(t.key, n) * 100);
    count = `${n} câu`; label = `${pct}%`;
  } else {
    const known = knownCount(t);
    pct = Math.round((known / t.deck.length) * 100);
    count = `${t.deck.length} từ`; label = `${known}/${t.deck.length}`;
  }
  return `<button class="topic-card" type="button" data-ui="topic-card" data-topic="${esc(t.key)}" style="--topic-accent:${t.accent}">
      <div><div class="topic-icon" data-ui="topic-icon">${t.icon}</div><div class="topic-title" data-ui="topic-title">${esc(t.title)}</div><div class="topic-sub" data-ui="topic-subtitle">${esc(t.subtitle || '')}</div></div>
      <div class="topic-foot"><div class="topic-meta"><span data-ui="topic-count">${count}</span><span data-ui="topic-progress-label">${label}</span></div>
      <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" data-ui="topic-progress-bar" style="width:${pct}%"></div></div></div>
    </button>`;
}

// Level picker: one chip per CEFR level plus the IELTS topics. Levels still
// being written stay pickable and explain themselves (see LEVELS in store.js).
function levelPickerHtml(current) {
  return `<div class="level-picker" role="group" aria-label="Chọn trình độ" data-ui="level-picker">${LEVELS.map(l => `
    <button class="chip level-chip${l.id === current ? ' is-active' : ''}${l.ready ? '' : ' is-soon'}" type="button" data-ui="level-chip" data-level="${l.id}" aria-pressed="${l.id === current}">
      <b>${l.label}</b><span>${l.ready ? esc(l.name) : 'Sắp có'}</span></button>`).join('')}</div>`;
}

function renderSection(id, level) {
  const page = PAGES[id];
  app.innerHTML = `<div class="page-wide">
    <div class="page-head"><h1>${page.title}</h1><p data-ui="tab-hint">${page.hint}</p></div>
    ${id === 'ipa' ? '' : levelPickerHtml(getLevel())}
    <div id="sectionBody"></div>
    <p class="storage-note" data-ui="storage-note" style="margin-top:32px">💾 Tiến độ được lưu tự động trên trình duyệt này. Đổi trình duyệt hoặc thiết bị thì tiến độ không đi theo.<br>🎤 Luyện nói dùng được trên Chrome, Edge, Safari (cần mạng và quyền micro).</p>
  </div>`;
  app.querySelectorAll('[data-ui="level-chip"]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.level !== getLevel()) { setLevel(b.dataset.level); route(); }
  }));
  const body = document.getElementById('sectionBody');
  if (id === 'ipa') { renderIpa(body, ipa, level ? level.topics : []); return {}; }
  if (!level) {
    body.innerHTML = `<div class="level-soon" data-ui="level-soon">${cheer(`<b>Trình độ ${levelInfo(getLevel()).label} sắp có! 🌱</b><br>${esc(levelInfo(getLevel()).soon)}`)}</div>`;
    bindArtFallbacks(body);
    return {};
  }
  const topics = level.topics.filter(t => id !== 'read' || level.passages[t.key]);
  body.innerHTML = `<div class="topic-grid is-app" data-ui="topic-grid">${topics.map(t => topicCardHtml(t, id, level.passages)).join('')}</div>`;
  body.querySelectorAll('[data-ui="topic-card"]').forEach(b => b.addEventListener('click', () => go(`#/${id}/${b.dataset.topic}`)));
  return {};
}

function go(hash) { location.hash = hash; }

// The chosen level's data, or null while that level is still "coming soon".
function chosenLevel() {
  return levelInfo(getLevel()).ready ? loadLevel(getLevel()) : Promise.resolve(null);
}

async function route() {
  const id = ++routeId;
  stopSpeaking();
  closeSheet();
  active = null;
  const [, section = '', key] = location.hash.split('/');
  markNav(PAGES[section] ? section : '');
  if (key && !levelInfo(levelOf(key)).ready) { location.replace('#/' + section); return; }
  let level;
  try { level = await (key ? loadLevel(levelOf(key)) : chosenLevel()); }
  catch (e) { if (id === routeId) showLoadError(); return; }
  if (id !== routeId) return;
  window.scrollTo(0, 0);
  const topic = key && level.topics.find(t => t.key === key);
  if (key && !topic) { location.replace('#/' + section); return; } // stale link
  const back = () => go('#/' + section);

  if (topic && section === 'flashcards') active = renderFlashcards(app, topic, back);
  else if (topic && section === 'read' && level.passages[key]) active = renderReading(app, topic, level.passages[key], back);
  else if (PAGES[section]) active = renderSection(section, level);
  else active = renderHome(app, level, levelInfo(getLevel()));
}

function showLoadError() {
  app.innerHTML = '<div class="page-wide"><div class="notice is-error" role="alert">Không tải được dữ liệu. Hãy kiểm tra mạng rồi tải lại trang.</div></div>';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen()) { closeSheet(); return; }
  if (sheetOpen() || e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (active && active.onKey) active.onKey(e);
});

(async function start() {
  const imported = importFromHash();
  renderShell();
  try { ipa = await loadIpa(); }
  catch (e) { showLoadError(); return; }
  window.addEventListener('hashchange', route);
  route();
  if (imported) toast(`✅ Đã chuyển ${imported} từ đã đánh dấu từ web cũ sang.`);
})();
