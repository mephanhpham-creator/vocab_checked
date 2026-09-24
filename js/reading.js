// Read-aloud practice: a passage per topic that re-uses the topic's words.
// Read one sentence at a time; each word turns green (heard) or red (missed).
//
// Passage markup (data/passages.json): {shown text|deck word} links a phrase
// to its flashcard entry; {text} alone when the text IS the deck word.
import { saveSentenceScore, getSentenceScore } from './store.js';
import { speak, stopSpeaking, RATE, canListen } from './speech.js';
import { compare, parseSentence } from './match.js';
import { bindMic, openSheet, esc } from './ui.js';

export function renderReading(root, topic, passage, goHome) {
  const sentences = passage.sentences.map(parseSentence);
  const findCard = (w) => topic.deck.find(c => c.word.toLowerCase() === w.toLowerCase());
  let cur = 0;
  const lastResult = {}; // sentence index -> compare() result, this visit only

  root.innerHTML = `
    <div class="topbar">
      <button class="home-btn" id="homeBtn">← Danh sách chủ đề</button>
      <div class="topbar-title">${esc(topic.title)}</div>
    </div>
    <h2 class="passage-title">${esc(passage.title)}</h2>
    <div class="subtitle">Chạm vào từ <span class="vocab-sample">được tô</span> để xem nghĩa · Bấm 🎤 rồi đọc câu đang chọn</div>
    ${canListen ? '' : '<div class="notice">⚠️ Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở bằng Chrome, Edge hoặc Safari để dùng 🎤.</div>'}
    <div class="passage" id="passage"></div>
    <div class="reader-panel">
      <div class="reader-status" id="readerStatus"></div>
      <div class="reader-controls">
        <button class="ctrl-btn" id="prevBtn" title="Câu trước (←)">←</button>
        <button class="speak-btn big" id="speakBtn" title="Nghe câu mẫu (L)">🔊</button>
        <button class="speak-btn big" id="speakSlowBtn" title="Nghe chậm (S)">🐌</button>
        <button class="speak-btn big mic-btn" id="micBtn" title="Đọc câu này (M)">🎤</button>
        <button class="ctrl-btn" id="nextBtn" title="Câu tiếp (→)">→</button>
      </div>
      <div class="heard" id="heard"></div>
    </div>
    <div class="stats">
      <div class="stat"><div class="num" id="statRead">0</div><div class="lbl">Câu đã đọc</div></div>
      <div class="stat"><div class="num" id="statAvg">–</div><div class="lbl">Điểm tốt nhất TB</div></div>
    </div>`;

  const el = (id) => root.querySelector('#' + id);

  function renderPassage() {
    el('passage').innerHTML = sentences.map((s, si) => {
      const res = lastResult[si];
      const words = s.words.map((w, wi) => {
        const cls = [w.vocab ? 'vocab' : '', res ? (res.words[wi].ok ? 'ok' : 'bad') : ''].join(' ').trim();
        return `<span class="w ${cls}"${w.vocab ? ` data-vocab="${esc(w.vocab)}"` : ''}>${esc(w.text)}</span>`;
      }).join(' ');
      return `<span class="sentence${si === cur ? ' current' : ''}" data-i="${si}">${words}</span>`;
    }).join(' ');
  }

  function renderStatus() {
    const best = getSentenceScore(topic.key, cur);
    el('readerStatus').innerHTML = `Câu ${cur + 1} / ${sentences.length}` +
      (best !== undefined ? ` · Tốt nhất: <b>${Math.round(best * 100)}%</b>` : '');
    const res = lastResult[cur];
    el('heard').innerHTML = res
      ? (res.heard ? `Máy nghe được: “${esc(res.heard)}” · <b>${Math.round(res.score * 100)}%</b>` : '🤔 Máy chưa nghe thấy gì — thử nói to và rõ hơn.')
      : '';
    const scores = sentences.map((_, i) => getSentenceScore(topic.key, i)).filter(s => s !== undefined);
    el('statRead').textContent = `${scores.length}/${sentences.length}`;
    el('statAvg').textContent = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) + '%' : '–';
  }

  function select(i) {
    stopSpeaking();
    cur = (i + sentences.length) % sentences.length;
    renderPassage();
    renderStatus();
  }

  function showWord(deckWord) {
    const c = findCard(deckWord);
    if (!c) return;
    const sheet = openSheet(`
      <div class="sheet-word">${esc(c.word)}</div>
      <div class="ipa">${esc(c.ipa)}</div>
      <div class="meaning-vi">${esc(c.vi)}</div>
      <div class="meaning-en">${esc(c.en)}</div>
      <div class="example">"${esc(c.ex)}"</div>
      <div class="sheet-actions"><button class="speak-btn big" id="sheetSpeak">🔊</button><button class="speak-btn big" id="sheetSlow">🐌</button></div>`);
    sheet.querySelector('#sheetSpeak').addEventListener('click', (e) => speak(c.tts || c.word, RATE.normal, e.currentTarget));
    sheet.querySelector('#sheetSlow').addEventListener('click', (e) => speak(c.tts || c.word, RATE.slowWord, e.currentTarget));
  }

  el('passage').addEventListener('click', (e) => {
    const w = e.target.closest('.w');
    const s = e.target.closest('.sentence');
    if (!s) return;
    if (+s.dataset.i !== cur) select(+s.dataset.i);
    else if (w && w.dataset.vocab) showWord(w.dataset.vocab);
  });
  el('homeBtn').addEventListener('click', goHome);
  el('prevBtn').addEventListener('click', () => select(cur - 1));
  el('nextBtn').addEventListener('click', () => select(cur + 1));
  el('speakBtn').addEventListener('click', (e) => speak(sentences[cur].text, RATE.normal, e.currentTarget));
  el('speakSlowBtn').addEventListener('click', (e) => speak(sentences[cur].text, RATE.slowSentence, e.currentTarget));
  bindMic(el('micBtn'), {
    onStart: () => { el('heard').textContent = '🎙️ Đang nghe… đọc xong máy sẽ tự dừng.'; },
    onInterim: (t) => { el('heard').textContent = '🎙️ ' + t; },
    onResult: (alts) => {
      const res = compare(sentences[cur].text, alts);
      lastResult[cur] = res;
      if (res.heard) saveSentenceScore(topic.key, cur, res.score);
      renderPassage();
      renderStatus();
    },
  });

  select(0);

  return {
    onKey(e) {
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'd') select(cur + 1);
      else if (k === 'arrowleft' || k === 'a') select(cur - 1);
      else if (k === 'l') el('speakBtn').click();
      else if (k === 's') el('speakSlowBtn').click();
      else if (k === 'm') el('micBtn').click();
      else if (k === 'escape') goHome();
    },
  };
}
