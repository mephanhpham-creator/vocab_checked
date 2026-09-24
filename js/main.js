// App shell + hash router. Routes:
//   #/flashcards        home, flashcard tab (default)
//   #/read              home, reading tab
//   #/ipa               home, IPA tab
//   #/flashcards/<key>  one topic's deck
//   #/read/<key>        one topic's passage
// Hash routes keep the phone's Back button working and each screen linkable.
import { loadData, knownCount, passageScore, importFromHash } from './store.js';
import { stopSpeaking } from './speech.js';
import { applyTheme, closeSheet, sheetOpen, esc, toast } from './ui.js';
import { renderFlashcards } from './flashcards.js';
import { renderReading } from './reading.js';
import { renderIpa } from './ipa.js';

const app = document.getElementById('app');
let data = null;
let active = null; // { onKey } of the current screen

const TABS = [
  { id: 'flashcards', label: '📚 Flashcard' },
  { id: 'read', label: '📖 Luyện đọc' },
  { id: 'ipa', label: '🔤 Phát âm IPA' },
];

function go(hash) { location.hash = hash; }

function topicCardHtml(t, tab) {
  let meta, pct;
  if (tab === 'read') {
    const p = data.passages[t.key];
    pct = Math.round(passageScore(t.key, p.sentences.length) * 100);
    meta = `<span>${p.sentences.length} câu</span><span class="stat-learned">${pct}%</span>`;
  } else {
    const known = knownCount(t);
    pct = Math.round((known / t.deck.length) * 100);
    meta = `<span>${t.deck.length} từ</span><span class="stat-learned">${known}/${t.deck.length}</span>`;
  }
  return `<button class="topic-card" data-key="${esc(t.key)}" style="background:${t.cardBg};--card-ink:${t.ink || '#0f172a'}">
      <div class="badge">${tab === 'read' ? 'Đọc' : 'Vocab'}</div>
      <div class="card-top">
        <div class="card-icon">${t.icon}</div>
        <div class="card-title">${esc(t.title)}</div>
        <div class="card-sub">${esc(t.subtitle || '')}</div>
      </div>
      <div class="card-bottom">
        <div class="card-stats">${meta}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </button>`;
}

function renderHome(tab) {
  applyTheme();
  const subtitles = {
    flashcards: 'Bấm vào 1 chủ đề để ôn flashcard · 🎤 để kiểm tra phát âm từng từ',
    read: 'Đọc to đoạn văn chứa từ đã học · máy tô xanh từ nghe đúng, đỏ từ bị sót',
    ipa: 'Chạm vào 1 âm để nghe ví dụ và tự nói thử',
  };
  app.innerHTML = `
    <h1>🎓 IELTS Vocab & Speaking</h1>
    <div class="toolbar tabs">${TABS.map(t => `<a class="chip${t.id === tab ? ' active' : ''}" href="#/${t.id}">${t.label}</a>`).join('')}</div>
    <div class="subtitle">${subtitles[tab]}</div>
    <div id="homeBody" class="home-body"></div>
    <div class="menu-note">💾 Tiến độ được lưu tự động trên trình duyệt này. (Đổi sang trình duyệt/thiết bị khác thì tiến độ không đồng bộ theo.)<br>🎤 Nhận dạng giọng nói hoạt động trên Chrome, Edge, Safari; cần mạng và quyền dùng micro.</div>`;
  const body = document.getElementById('homeBody');
  if (tab === 'ipa') { renderIpa(body, data.ipa, data.topics); return {}; }
  body.innerHTML = `<div class="grid">${data.topics.filter(t => tab !== 'read' || data.passages[t.key]).map(t => topicCardHtml(t, tab)).join('')}</div>`;
  body.querySelectorAll('.topic-card').forEach(b => b.addEventListener('click', () => go(`#/${tab}/${b.dataset.key}`)));
  return {};
}

function route() {
  stopSpeaking();
  closeSheet();
  window.scrollTo(0, 0);
  const [, tab = 'flashcards', key] = location.hash.split('/');
  const topic = key && data.topics.find(t => t.key === key);
  const goHome = () => go('#/' + tab);

  if (topic && tab === 'flashcards') { applyTheme(topic); active = renderFlashcards(app, topic, goHome); }
  else if (topic && tab === 'read' && data.passages[key]) { applyTheme(topic); active = renderReading(app, topic, data.passages[key], goHome); }
  else active = renderHome(TABS.some(t => t.id === tab) ? tab : 'flashcards');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen()) { closeSheet(); return; }
  if (sheetOpen() || e.target.closest('input, textarea')) return;
  if (active && active.onKey) active.onKey(e);
});

(async function start() {
  const imported = importFromHash();
  try { data = await loadData(); }
  catch (e) { app.innerHTML = '<div class="notice">Không tải được dữ liệu. Hãy tải lại trang.</div>'; return; }
  window.addEventListener('hashchange', route);
  route();
  if (imported) toast(`✅ Đã chuyển ${imported} từ đã đánh dấu từ web cũ sang.`);
})();
