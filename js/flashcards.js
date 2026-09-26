// S2 Flashcard deck for one topic: 3D flip, known/unknown marks, filter,
// shortcuts, and a 🎤 check of the headword.
import { getStatus, setStatus, resetTopic } from './store.js';
import { speak, stopSpeaking, RATE } from './speech.js';
import { checkWord } from './match.js';
import { $, esc, topicStyle, speakBtn, slowBtn, micBtn, bindMic, wordResult, liveHtml, result, topicHead, cheer, bindArtFallbacks } from './ui.js';

export function renderFlashcards(root, topic, goHome) {
  root.innerHTML = `<div class="app themed" style="${topicStyle(topic)}">
    ${topicHead(topic, 'Từ vựng', `${topic.deck.length} từ`)}
    <div class="toolbar">
      <button class="chip is-active" type="button" data-ui="filter-all"></button>
      <button class="chip" type="button" data-ui="filter-unknown"></button>
      <button class="chip" type="button" data-ui="reset">↺ Reset tiến độ</button>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-num" data-ui="stat-total"></div><div class="stat-lbl">Tổng số từ</div></div>
      <div class="stat"><div class="stat-num is-success" data-ui="stat-known"></div><div class="stat-lbl">✅ Đã thuộc</div></div>
      <div class="stat"><div class="stat-num is-error" data-ui="stat-unknown"></div><div class="stat-lbl">😕 Chưa thuộc</div></div>
    </div>
    <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" data-ui="progress-bar"></div></div>
    <div class="done-banner" data-ui="done-banner" role="status" hidden>${cheer(`<b>Hoàn thành bộ từ này rồi! 🎉</b><br>Bạn đã thuộc cả ${topic.deck.length} từ. Bấm “↺ Reset tiến độ” để ôn lại, hoặc chọn chủ đề khác.`)}</div>
    <div class="fc-scene" data-ui="scene">
      <div class="fc-inner" data-ui="card" role="button" tabindex="0" aria-label="Thẻ từ vựng, chạm để lật">
        <div class="flashcard">
          <span class="fc-pos" data-ui="pos"></span><span class="fc-status" data-ui="status"></span>
          <div class="fc-emoji" data-ui="emoji" aria-hidden="true"></div>
          <div class="fc-word" data-ui="word"></div>
          <div class="ipa" data-ui="ipa"></div>
          <div class="fc-controls">${speakBtn()}${micBtn()}${slowBtn()}</div>
          <div class="fc-check" data-ui="check-result"></div>
          <div class="fc-hint">Chạm vào thẻ để lật</div>
        </div>
        <div class="flashcard is-back">
          <div class="fc-back-word" data-ui="back-word"></div>
          <div class="fc-vi" data-ui="meaning-vi"></div>
          <p class="fc-en" data-ui="meaning-en"></p>
          <p class="fc-ex" data-ui="example"></p>
          <div class="fc-syn" data-ui="synonyms"></div>
          <div class="fc-hint">Chạm để lật lại</div>
        </div>
      </div>
    </div>
    <div class="empty-state" data-ui="empty-state" hidden>${cheer('<b>Không còn từ nào chưa thuộc! 🌟</b><br>Chọn “📚 Tất cả” để ôn lại, hoặc học chủ đề khác nhé.')}</div>
    <div class="mark-row" data-ui="mark-row"><button class="btn-mark is-unknown" type="button" data-ui="mark-unknown" aria-pressed="false">😕 Chưa thuộc</button><button class="btn-mark is-known" type="button" data-ui="mark-known" aria-pressed="false">✅ Đã thuộc</button></div>
    <div class="nav-row" data-ui="nav-row"><button class="btn-soft" type="button" data-ui="prev">← Trước</button><button class="btn-soft" type="button" data-ui="flip">Lật thẻ 🔄</button><button class="btn-soft" type="button" data-ui="next">Tiếp →</button></div>
    <div class="counter" data-ui="counter"></div>
    <details class="shortcuts" data-ui="shortcuts"><summary>⌨️ Phím tắt (máy tính)</summary><dl>
      <dt>Lật thẻ</dt><dd><kbd>Space</kbd></dd><dt>Thẻ trước / tiếp</dt><dd><kbd>←</kbd> <kbd>→</kbd></dd>
      <dt>Đã thuộc / Chưa thuộc</dt><dd><kbd>K</kbd> <kbd>U</kbd></dd><dt>Nghe / nghe chậm</dt><dd><kbd>L</kbd> <kbd>S</kbd></dd>
      <dt>Nói để kiểm tra</dt><dd><kbd>M</kbd></dd><dt>Đổi bộ lọc</dt><dd><kbd>F</kbd></dd><dt>Về danh sách</dt><dd><kbd>Esc</kbd></dd></dl></details>
  </div>`;

  bindArtFallbacks(root);
  const el = (name) => $(root, name);
  const deck = topic.deck;
  const card = el('card');
  let order = [], pos = 0, flipped = false, filterMode = 'all';

  const status = (i) => getStatus(topic.key, deck[i].word);
  const current = () => deck[order[pos]];

  function renderCard() {
    stopSpeaking();
    order = deck.map((_, i) => i).filter(i => filterMode === 'all' || status(i) !== 'known');
    pos = Math.max(0, Math.min(pos, order.length - 1));
    const empty = order.length === 0;
    // Everything known: the done banner already cheers, so skip the second mascot.
    el('empty-state').hidden = !empty || deck.every((_, i) => status(i) === 'known');
    for (const name of ['scene', 'mark-row', 'nav-row', 'counter']) el(name).hidden = empty;
    updateStats();
    if (empty) return;

    const c = current(), s = status(order[pos]);
    el('pos').textContent = (c.pos || '').toUpperCase();
    // A few animals have no accurate emoji (e.g. stingray, sea lion) — those
    // carry a hand-authored inline SVG silhouette in `icon_svg` instead.
    if (c.icon_svg) el('emoji').innerHTML = c.icon_svg; else el('emoji').textContent = c.emoji || '📘';
    el('word').textContent = c.word;
    el('ipa').textContent = c.ipa || '';
    el('check-result').innerHTML = '';
    el('back-word').textContent = c.word;
    el('meaning-vi').textContent = c.vi || '';
    el('meaning-en').textContent = c.en || '';
    el('example').textContent = c.ex ? `“${c.ex}”` : '';
    el('synonyms').innerHTML = '<b>Đồng nghĩa:</b> ' + esc(c.syn || '—');
    el('status').textContent = s === 'known' ? '✅' : s === 'unknown' ? '😕' : '';
    el('status').setAttribute('aria-label', s === 'known' ? 'Đã thuộc' : s === 'unknown' ? 'Chưa thuộc' : '');
    el('mark-known').setAttribute('aria-pressed', s === 'known');
    el('mark-unknown').setAttribute('aria-pressed', s === 'unknown');
    el('counter').textContent = `Thẻ ${pos + 1} / ${order.length}` + (filterMode === 'unknown' ? ' (chưa thuộc)' : '');
    flipped = false;
    card.classList.remove('is-flipped');
  }

  function updateStats() {
    const known = deck.filter((_, i) => status(i) === 'known').length;
    const unknown = deck.filter((_, i) => status(i) === 'unknown').length;
    const pct = Math.round((known / deck.length) * 100);
    el('stat-total').textContent = deck.length;
    el('stat-known').textContent = known;
    el('stat-unknown').textContent = unknown;
    el('filter-all').textContent = `📚 Tất cả (${deck.length})`;
    el('filter-unknown').textContent = `🧠 Chỉ từ chưa thuộc (${deck.length - known})`;
    el('progress-bar').style.width = pct + '%';
    el('progress-bar').parentElement.setAttribute('aria-valuenow', pct);
    el('done-banner').hidden = known !== deck.length;
  }

  // `tts` is an optional respelling for words the speech engine misreads;
  // the visible word is never affected.
  function speakCurrent(rate, btn) { if (order.length) { const c = current(); speak(c.tts || c.word, rate, btn); } }
  function flip() { flipped = !flipped; card.classList.toggle('is-flipped', flipped); }
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
    el('filter-all').classList.toggle('is-active', mode === 'all');
    el('filter-unknown').classList.toggle('is-active', mode === 'unknown');
    pos = 0; renderCard();
  }

  card.addEventListener('click', (e) => { if (!e.target.closest('button')) flip(); });
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === card) { e.preventDefault(); flip(); } });
  el('flip').addEventListener('click', flip);
  el('speak').addEventListener('click', (e) => { e.stopPropagation(); speakCurrent(RATE.normal, e.currentTarget); });
  el('speak-slow').addEventListener('click', (e) => { e.stopPropagation(); speakCurrent(RATE.slowWord, e.currentTarget); });
  bindMic(el('mic'), {
    onStart: () => { el('check-result').innerHTML = liveHtml(`Đang nghe… hãy nói “${current().word}”`); },
    onResult: (alts) => { const r = checkWord(current().word, alts); el('check-result').innerHTML = wordResult(r.ok, r.heard); },
    onError: (msg) => { el('check-result').innerHTML = result('empty', esc(msg)); },
  });
  el('next').addEventListener('click', next);
  el('prev').addEventListener('click', prev);
  el('mark-known').addEventListener('click', () => mark('known'));
  el('mark-unknown').addEventListener('click', () => mark('unknown'));
  el('back').addEventListener('click', goHome);
  el('filter-all').addEventListener('click', () => setFilter('all'));
  el('filter-unknown').addEventListener('click', () => setFilter('unknown'));
  el('reset').addEventListener('click', () => {
    if (confirm('Reset toàn bộ tiến độ của chủ đề này (đã thuộc / chưa thuộc)?')) { resetTopic(topic.key); pos = 0; renderCard(); }
  });

  renderCard();

  return {
    onKey(e) {
      if (e.target.closest('button, summary, a')) { if (e.key === ' ' || e.key === 'Enter') return; }
      const k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); flip(); }
      else if (k === 'arrowright' || k === 'd') next();
      else if (k === 'arrowleft' || k === 'a') prev();
      else if (k === 'k') mark('known');
      else if (k === 'u') mark('unknown');
      else if (k === 'l') speakCurrent(RATE.normal, el('speak'));
      else if (k === 's') speakCurrent(RATE.slowWord, el('speak-slow'));
      else if (k === 'm') el('mic').click();
      else if (k === 'f') setFilter(filterMode === 'all' ? 'unknown' : 'all');
      else if (k === 'escape') goHome();
    },
  };
}
