// App shell + hash router. Routes:
//   #/flashcards        home, flashcard tab (default)
//   #/read              home, reading tab
//   #/ipa               home, IPA tab
//   #/flashcards/<key>  one topic's deck
//   #/read/<key>        one topic's passage
// Hash routes keep the phone's Back button working and each screen linkable.
import { loadData, knownCount, passageScore, importFromHash } from './store.js';
import { stopSpeaking } from './speech.js';
import { closeSheet, sheetOpen, esc, toast } from './ui.js';
import { renderFlashcards } from './flashcards.js';
import { renderReading } from './reading.js';
import { renderIpa } from './ipa.js';

const app = document.getElementById('app');
let data = null;
let active = null; // { onKey } of the current screen

const TABS = [
  { id: 'flashcards', label: '📚 Flashcard', hint: 'Chọn chủ đề để học từ vựng qua thẻ nhớ hai mặt và luyện phát âm' },
  { id: 'read', label: '📖 Luyện đọc', hint: 'Luyện đọc đoạn văn và chấm phát âm theo thời gian thực' },
  { id: 'ipa', label: '🔤 Phát âm IPA', hint: 'Chạm vào một âm để nghe ví dụ và tự nói thử' },
];

function go(hash) { location.hash = hash; }

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

function renderHome(tabId) {
  const tab = TABS.find(t => t.id === tabId);
  app.innerHTML = `<div class="app">
    <h1 class="app-title">🎓 IELTS Vocab &amp; Speaking</h1>
    <nav class="tabs is-main" role="tablist">${TABS.map(t => `<a class="chip" role="tab" href="#/${t.id}" aria-selected="${t.id === tab.id}" data-ui="tab" data-tab="${t.id}">${t.label}</a>`).join('')}</nav>
    <p class="tab-hint" data-ui="tab-hint">${tab.hint}</p>
    <div id="homeBody"></div>
    <p class="storage-note" data-ui="storage-note">💾 Tiến độ được lưu tự động trên trình duyệt này. Đổi trình duyệt hoặc thiết bị thì tiến độ không đi theo.<br>🎤 Luyện nói dùng được trên Chrome, Edge, Safari (cần mạng và quyền micro).</p>
  </div>`;
  const body = document.getElementById('homeBody');
  if (tab.id === 'ipa') { renderIpa(body, data.ipa, data.topics); return {}; }
  const topics = data.topics.filter(t => tab.id !== 'read' || data.passages[t.key]);
  body.innerHTML = `<div class="topic-grid is-app" data-ui="topic-grid">${topics.map(t => topicCardHtml(t, tab.id)).join('')}</div>`;
  body.querySelectorAll('[data-ui="topic-card"]').forEach(b => b.addEventListener('click', () => go(`#/${tab.id}/${b.dataset.topic}`)));
  return {};
}

function route() {
  stopSpeaking();
  closeSheet();
  window.scrollTo(0, 0);
  const [, tab = 'flashcards', key] = location.hash.split('/');
  const topic = key && data.topics.find(t => t.key === key);
  const goHome = () => go('#/' + tab);

  if (topic && tab === 'flashcards') active = renderFlashcards(app, topic, goHome);
  else if (topic && tab === 'read' && data.passages[key]) active = renderReading(app, topic, data.passages[key], goHome);
  else active = renderHome(TABS.some(t => t.id === tab) ? tab : 'flashcards');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen()) { closeSheet(); return; }
  if (sheetOpen() || e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (active && active.onKey) active.onKey(e);
});

(async function start() {
  const imported = importFromHash();
  try { data = await loadData(); }
  catch (e) { app.innerHTML = '<div class="app"><div class="notice is-error" role="alert">Không tải được dữ liệu. Hãy tải lại trang.</div></div>'; return; }
  window.addEventListener('hashchange', route);
  route();
  if (imported) toast(`✅ Đã chuyển ${imported} từ đã đánh dấu từ web cũ sang.`);
})();
