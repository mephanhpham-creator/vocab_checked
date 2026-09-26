// App shell (top nav on desktop, bottom nav on phones) + hash router. Routes:
//   #/                  home dashboard
//   #/flashcards        topic list for flashcards
//   #/read              topic list for read-aloud
//   #/ipa               IPA chart + minimal pairs
//   #/flashcards/<key>  one topic's deck
//   #/read/<key>        one topic's passage
// Hash routes keep the phone's Back button working and each screen linkable.
import { loadData, knownCount, passageScore, importFromHash } from './store.js';
import { stopSpeaking } from './speech.js';
import { closeSheet, sheetOpen, esc, toast } from './ui.js';
import { renderHome } from './home.js';
import { renderFlashcards } from './flashcards.js';
import { renderReading } from './reading.js';
import { renderIpa } from './ipa.js';

const app = document.getElementById('app');
let data = null;
let active = null; // { onKey } of the current screen

const NAV = [
  { id: '', icon: '🏠', label: 'Trang chủ' },
  { id: 'flashcards', icon: '📚', label: 'Từ vựng' },
  { id: 'read', icon: '📖', label: 'Luyện đọc' },
  { id: 'ipa', icon: '🔤', label: 'Phát âm IPA' },
];
const PAGES = {
  flashcards: { title: 'Từ vựng', hint: 'Chọn chủ đề để học từ vựng qua thẻ nhớ hai mặt và luyện phát âm từng từ.' },
  read: { title: 'Luyện đọc', hint: 'Đọc to đoạn văn chứa từ đã học. Máy tô xanh từ nghe đúng, đỏ từ bị sót.' },
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

function topicCardHtml(t, tab) {
  let count, label, pct;
  if (tab === 'read') {
    const n = data.passages[t.key].sentences.length;
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

function renderSection(id) {
  const page = PAGES[id];
  app.innerHTML = `<div class="page-wide">
    <div class="page-head"><h1>${page.title}</h1><p data-ui="tab-hint">${page.hint}</p></div>
    <div id="sectionBody"></div>
    <p class="storage-note" data-ui="storage-note" style="margin-top:32px">💾 Tiến độ được lưu tự động trên trình duyệt này. Đổi trình duyệt hoặc thiết bị thì tiến độ không đi theo.<br>🎤 Luyện nói dùng được trên Chrome, Edge, Safari (cần mạng và quyền micro).</p>
  </div>`;
  const body = document.getElementById('sectionBody');
  if (id === 'ipa') { renderIpa(body, data.ipa, data.topics); return {}; }
  const topics = data.topics.filter(t => id !== 'read' || data.passages[t.key]);
  body.innerHTML = `<div class="topic-grid is-app" data-ui="topic-grid">${topics.map(t => topicCardHtml(t, id)).join('')}</div>`;
  body.querySelectorAll('[data-ui="topic-card"]').forEach(b => b.addEventListener('click', () => go(`#/${id}/${b.dataset.topic}`)));
  return {};
}

function go(hash) { location.hash = hash; }

function route() {
  stopSpeaking();
  closeSheet();
  window.scrollTo(0, 0);
  const [, section = '', key] = location.hash.split('/');
  const topic = key && data.topics.find(t => t.key === key);
  const back = () => go('#/' + section);
  markNav(PAGES[section] ? section : '');

  if (topic && section === 'flashcards') active = renderFlashcards(app, topic, back);
  else if (topic && section === 'read' && data.passages[key]) active = renderReading(app, topic, data.passages[key], back);
  else if (PAGES[section]) active = renderSection(section);
  else active = renderHome(app, data);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen()) { closeSheet(); return; }
  if (sheetOpen() || e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (active && active.onKey) active.onKey(e);
});

(async function start() {
  const imported = importFromHash();
  renderShell();
  try { data = await loadData(); }
  catch (e) { app.innerHTML = '<div class="page-wide"><div class="notice is-error" role="alert">Không tải được dữ liệu. Hãy tải lại trang.</div></div>'; return; }
  window.addEventListener('hashchange', route);
  route();
  if (imported) toast(`✅ Đã chuyển ${imported} từ đã đánh dấu từ web cũ sang.`);
})();
