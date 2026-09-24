// Flashcard deck for one topic — ported from the original Netlify app
// (3D flip, known/unknown marks, filter, shortcuts), plus a 🎤 check.
import { getStatus, setStatus, resetTopic } from './store.js';
import { speak, stopSpeaking, RATE } from './speech.js';
import { checkWord } from './match.js';
import { bindMic, resultHtml, esc } from './ui.js';

export function renderFlashcards(root, topic, goHome) {
  root.innerHTML = `
    <div class="topbar">
      <button class="home-btn" id="homeBtn">← Danh sách chủ đề</button>
      <div class="topbar-title">${esc(topic.title)}</div>
    </div>

    <div class="toolbar">
      <div class="chip active" id="filterAll">📚 Tất cả (<span id="countAllChip">0</span>)</div>
      <div class="chip" id="filterUnknown">🧠 Chỉ từ chưa thuộc (<span id="countUnknownChip">0</span>)</div>
      <div class="chip" id="resetBtn">↺ Reset tiến độ</div>
    </div>

    <div class="stats">
      <div class="stat"><div class="num" id="statTotal">0</div><div class="lbl">Tổng số từ</div></div>
      <div class="stat"><div class="num" id="statKnown" style="color:var(--known)">0</div><div class="lbl">Đã thuộc</div></div>
      <div class="stat"><div class="num" id="statUnknown" style="color:var(--unknown)">0</div><div class="lbl">Chưa thuộc</div></div>
    </div>

    <div class="progress-track-fc"><div class="progress-fill-fc" id="progressFillFc"></div></div>

    <div class="scene" id="scene">
      <div class="card" id="card">
        <div class="face front">
          <div class="badge-pos" id="posBadge"></div>
          <div class="status-dot" id="statusDot"></div>
          <div class="emoji" id="emojiFront"></div>
          <div class="word-row">
            <div class="word" id="wordFront"></div>
            <button class="speak-btn" id="speakBtn" type="button" aria-label="Nghe phát âm" title="Nghe phát âm (L)">🔊</button>
            <button class="speak-btn" id="speakSlowBtn" type="button" aria-label="Nghe phát âm siêu chậm" title="Nghe phát âm siêu chậm (S)">🐌</button>
            <button class="speak-btn mic-btn" id="micBtn" type="button" aria-label="Nói để kiểm tra phát âm" title="Nói để kiểm tra phát âm (M)">🎤</button>
          </div>
          <div class="ipa" id="ipaFront"></div>
          <div class="check-result" id="checkResult"></div>
          <div class="hint">Nhấn <kbd>Space</kbd> hoặc chạm để lật thẻ</div>
        </div>
        <div class="face back">
          <div class="word" id="wordBack"></div>
          <div class="meaning-vi" id="meaningVi"></div>
          <div class="meaning-en" id="meaningEn"></div>
          <div class="example" id="example"></div>
          <div class="synonyms" id="synonyms"></div>
        </div>
      </div>
    </div>

    <div class="empty-state" id="emptyState">
      🎉 Bạn đã đánh dấu <b>thuộc</b> hết các từ trong bộ lọc này rồi!<br>Chuyển sang "Tất cả" hoặc học chủ đề khác nhé.
    </div>

    <div class="mark-row">
      <button class="mark-btn unknown" id="btnUnknown">😕 Chưa thuộc <kbd>U</kbd></button>
      <button class="mark-btn known" id="btnKnown">✅ Đã thuộc <kbd>K</kbd></button>
    </div>

    <div class="controls">
      <button class="ctrl-btn" id="prevBtn" title="Từ trước (←)">←</button>
      <button class="ctrl-btn" id="flipBtn" title="Lật thẻ (Space)">⤾</button>
      <button class="ctrl-btn" id="nextBtn" title="Từ tiếp theo (→)">→</button>
    </div>

    <div class="counter" id="counter"></div>
    <div class="done-banner" id="doneBanner">🎉 Hoàn thành bộ từ này rồi! Xem lại từ "chưa thuộc" hoặc Reset để ôn lại từ đầu.</div>

    <div class="shortcuts">
      <h3>⌨️ Phím tắt</h3>
      <div class="row"><span>Lật thẻ</span><span><kbd>Space</kbd> / <kbd>Enter</kbd></span></div>
      <div class="row"><span>Từ tiếp theo</span><span><kbd>→</kbd> / <kbd>D</kbd></span></div>
      <div class="row"><span>Từ trước</span><span><kbd>←</kbd> / <kbd>A</kbd></span></div>
      <div class="row"><span>Đánh dấu đã thuộc</span><span><kbd>K</kbd></span></div>
      <div class="row"><span>Đánh dấu chưa thuộc</span><span><kbd>U</kbd></span></div>
      <div class="row"><span>Nghe phát âm / siêu chậm</span><span><kbd>L</kbd> / <kbd>S</kbd></span></div>
      <div class="row"><span>Nói để kiểm tra phát âm</span><span><kbd>M</kbd></span></div>
      <div class="row"><span>Chuyển bộ lọc (chỉ từ chưa thuộc)</span><span><kbd>F</kbd></span></div>
      <div class="row"><span>Quay lại danh sách chủ đề</span><span><kbd>Esc</kbd></span></div>
    </div>`;

  const el = (id) => root.querySelector('#' + id);
  const deck = topic.deck;
  const card = el('card');
  let order = [], pos = 0, flipped = false, filterMode = 'all';

  const status = (i) => getStatus(topic.key, deck[i].word);

  function clampPos() {
    order = deck.map((_, i) => i).filter(i => filterMode === 'all' || status(i) !== 'known');
    pos = Math.max(0, Math.min(pos, order.length - 1));
  }

  function renderCard() {
    stopSpeaking();
    clampPos();
    const empty = order.length === 0;
    el('emptyState').classList.toggle('show', empty);
    for (const sel of ['#scene', '.mark-row', '.controls']) root.querySelector(sel).style.display = empty ? 'none' : '';
    updateStats();
    if (empty) { el('counter').textContent = ''; el('doneBanner').classList.remove('show'); return; }

    const idx = order[pos], c = deck[idx], s = status(idx);
    el('posBadge').textContent = (c.pos || '').toUpperCase();
    // A few animals have no accurate emoji (e.g. stingray, sea lion) — those
    // carry a hand-authored inline SVG silhouette in `icon_svg` instead.
    const emojiEl = el('emojiFront');
    if (c.icon_svg) emojiEl.innerHTML = c.icon_svg; else emojiEl.textContent = c.emoji || '📘';
    el('wordFront').textContent = c.word;
    el('ipaFront').textContent = c.ipa || '';
    el('checkResult').innerHTML = '';
    el('wordBack').textContent = c.word;
    el('meaningVi').textContent = c.vi || '';
    el('meaningEn').textContent = c.en || '';
    el('example').textContent = c.ex ? '"' + c.ex + '"' : '';
    el('synonyms').innerHTML = '<b>Đồng nghĩa:</b> ' + (c.syn || '—');
    el('statusDot').textContent = s === 'known' ? '✅' : s === 'unknown' ? '😕' : '';
    el('btnKnown').classList.toggle('on', s === 'known');
    el('btnUnknown').classList.toggle('on', s === 'unknown');
    el('counter').textContent = `Thẻ ${pos + 1} / ${order.length}` + (filterMode === 'unknown' ? ' (chưa thuộc)' : '');
    flipped = false;
    card.classList.remove('flipped');
    el('doneBanner').classList.toggle('show', deck.every((_, i) => status(i) === 'known'));
  }

  function updateStats() {
    const known = deck.filter((_, i) => status(i) === 'known').length;
    const unknown = deck.filter((_, i) => status(i) === 'unknown').length;
    el('statTotal').textContent = deck.length;
    el('statKnown').textContent = known;
    el('statUnknown').textContent = unknown;
    el('countAllChip').textContent = deck.length;
    el('countUnknownChip').textContent = deck.length - known;
    el('progressFillFc').style.width = Math.round((known / deck.length) * 100) + '%';
  }

  const current = () => deck[order[pos]];
  // `tts` is an optional respelling for words the speech engine misreads
  // (e.g. "pyjamas"); the visible word is never affected.
  function speakCurrent(rate, btnId) { if (order.length) { const c = current(); speak(c.tts || c.word, rate, el(btnId)); } }
  function flip() { flipped = !flipped; card.classList.toggle('flipped', flipped); }
  function next() { if (order.length) { pos = (pos + 1) % order.length; renderCard(); } }
  function prev() { if (order.length) { pos = (pos - 1 + order.length) % order.length; renderCard(); } }
  function mark(s) {
    if (!order.length) return;
    const w = current().word;
    setStatus(topic.key, w, getStatus(topic.key, w) === s ? null : s);
    renderCard();
  }
  function setFilter(mode) {
    filterMode = mode;
    el('filterAll').classList.toggle('active', mode === 'all');
    el('filterUnknown').classList.toggle('active', mode === 'unknown');
    pos = 0; renderCard();
  }

  card.addEventListener('click', flip);
  el('flipBtn').addEventListener('click', flip);
  el('speakBtn').addEventListener('click', (e) => { e.stopPropagation(); speakCurrent(RATE.normal, 'speakBtn'); });
  el('speakSlowBtn').addEventListener('click', (e) => { e.stopPropagation(); speakCurrent(RATE.slowWord, 'speakSlowBtn'); });
  bindMic(el('micBtn'), {
    onStart: () => { el('checkResult').innerHTML = '<span class="res">🎙️ Đang nghe…</span>'; },
    onResult: (alts) => { const r = checkWord(current().word, alts); el('checkResult').innerHTML = resultHtml(r.ok, r.heard); },
  });
  el('nextBtn').addEventListener('click', next);
  el('prevBtn').addEventListener('click', prev);
  el('btnKnown').addEventListener('click', () => mark('known'));
  el('btnUnknown').addEventListener('click', () => mark('unknown'));
  el('homeBtn').addEventListener('click', goHome);
  el('filterAll').addEventListener('click', () => setFilter('all'));
  el('filterUnknown').addEventListener('click', () => setFilter('unknown'));
  el('resetBtn').addEventListener('click', () => {
    if (confirm('Reset toàn bộ tiến độ của chủ đề này (đã thuộc / chưa thuộc)?')) { resetTopic(topic.key); pos = 0; renderCard(); }
  });

  renderCard();

  return {
    onKey(e) {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'enter') { e.preventDefault(); flip(); }
      else if (k === 'arrowright' || k === 'd') next();
      else if (k === 'arrowleft' || k === 'a') prev();
      else if (k === 'k') mark('known');
      else if (k === 'u') mark('unknown');
      else if (k === 'l') speakCurrent(RATE.normal, 'speakBtn');
      else if (k === 's') speakCurrent(RATE.slowWord, 'speakSlowBtn');
      else if (k === 'm') el('micBtn').click();
      else if (k === 'f') setFilter(filterMode === 'all' ? 'unknown' : 'all');
      else if (k === 'escape') goHome();
    },
  };
}
