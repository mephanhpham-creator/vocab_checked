// S3 Read aloud: a passage per topic that re-uses the topic's words.
// Read one sentence at a time; each word turns green (heard) or red (missed).
import { saveSentenceScore, getSentenceScore } from './store.js';
import { speak, stopSpeaking, RATE, canListen } from './speech.js';
import { compare, parseSentence } from './match.js';
import { $, esc, topicStyle, speakBtn, slowBtn, micBtn, bindMic, openSheet, result, liveHtml } from './ui.js';

const IDLE_HINT = '<p class="quiz-hint">Bấm 🎤 rồi đọc to câu đang được tô sáng.</p>';

export function renderReading(root, topic, passage, goHome) {
  const sentences = passage.sentences.map(parseSentence);
  const findCard = (w) => topic.deck.find(c => c.word.toLowerCase() === w.toLowerCase());
  let cur = 0;
  const lastResult = {}; // sentence index -> compare() result, this visit only

  root.innerHTML = `<div class="app themed" style="${topicStyle(topic)}">
    <div class="topbar"><button class="btn-back" type="button" data-ui="back">← Danh sách chủ đề</button><span class="topic-name" data-ui="topic-name">${esc(topic.title)}</span></div>
    <div data-ui="notice-slot">${canListen ? '' : '<div class="notice is-warn" data-ui="notice" role="alert"><span aria-hidden="true">⚠️</span><span>Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở trang bằng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b> để luyện nói.</span></div>'}</div>
    <h2 class="passage-title" data-ui="passage-title">${esc(passage.title)}</h2>
    <p class="read-hint">Chạm từ <b>in đậm</b> để xem nghĩa · chạm câu khác để chuyển câu</p>
    <div class="passage" data-ui="passage"></div>
    <div class="status" data-ui="status"></div>
    <div class="reader-controls">
      <button class="btn-nav" type="button" data-ui="prev" aria-label="Câu trước">←</button>
      ${speakBtn()}${micBtn()}${slowBtn()}
      <button class="btn-nav" type="button" data-ui="next" aria-label="Câu tiếp">→</button>
    </div>
    <div class="heard" data-ui="heard"></div>
    <div class="stats is-two">
      <div class="stat"><div class="stat-num" data-ui="stat-read"></div><div class="stat-lbl">Câu đã đọc</div></div>
      <div class="stat"><div class="stat-num" data-ui="stat-avg"></div><div class="stat-lbl">Điểm tốt nhất TB</div></div>
    </div>
  </div>`;

  const el = (name) => $(root, name);

  function renderPassage() {
    el('passage').innerHTML = sentences.map((s, si) => {
      const res = lastResult[si];
      const words = s.words.map((w, wi) => {
        const cls = ['word', w.vocab ? 'is-vocab' : '', res ? (res.words[wi].ok ? 'is-ok' : 'is-bad') : ''].filter(Boolean).join(' ');
        return `<span class="${cls}" data-ui="word"${w.vocab ? ` data-vocab="${esc(w.vocab)}" role="button" tabindex="0"` : ''}>${esc(w.text)}</span>`;
      }).join(' ');
      return `<span class="sentence${si === cur ? ' is-current' : ''}" data-ui="sentence" data-i="${si}">${words}</span>`;
    }).join(' ');
  }

  function heardHtml(res) {
    if (!res) return IDLE_HINT;
    if (!res.heard) return result('empty', '<b>Chưa nghe rõ.</b> Thử nói to và rõ hơn, rồi bấm 🎤 lại.');
    const pct = Math.round(res.score * 100);
    if (res.score === 1) return result('correct', `<b>Tuyệt vời!</b> Máy nghe đúng cả câu · <b>100%</b>`);
    return result('wrong', `Máy nghe được: “${esc(res.heard)}” · <b>${pct}%</b>. Từ gạch sóng là từ máy chưa nghe ra.`);
  }

  function renderStatus() {
    const best = getSentenceScore(topic.key, cur);
    el('status').innerHTML = `Câu ${cur + 1} / ${sentences.length}` + (best !== undefined ? ` · Tốt nhất: <b>${Math.round(best * 100)}%</b>` : '');
    el('heard').classList.remove('is-live');
    el('heard').innerHTML = heardHtml(lastResult[cur]);
    const scores = sentences.map((_, i) => getSentenceScore(topic.key, i)).filter(s => s !== undefined);
    el('stat-read').textContent = `${scores.length}/${sentences.length}`;
    el('stat-avg').textContent = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) + '%' : '–';
  }

  function select(i) {
    stopSpeaking();
    cur = (i + sentences.length) % sentences.length;
    renderPassage();
    renderStatus();
  }

  // S7 word detail sheet.
  function showWord(deckWord) {
    const c = findCard(deckWord);
    if (!c) return;
    const sheet = openSheet(`
      <div class="sheet-head"><div class="sheet-word" data-ui="word">${esc(c.word)}</div><div class="ipa sheet-center" data-ui="ipa">${esc(c.ipa)}</div></div>
      <div class="sheet-center"><div class="sheet-vi" data-ui="meaning-vi">${esc(c.vi)}</div><p class="sheet-en" data-ui="meaning-en">${esc(c.en)}</p></div>
      ${c.ex ? `<p class="sheet-example" data-ui="example">“${esc(c.ex)}”</p>` : ''}
      <div class="sheet-actions">${speakBtn()}${slowBtn()}</div>`, { label: `Nghĩa của từ ${c.word}` });
    $(sheet, 'speak').addEventListener('click', (e) => speak(c.tts || c.word, RATE.normal, e.currentTarget));
    $(sheet, 'speak-slow').addEventListener('click', (e) => speak(c.tts || c.word, RATE.slowWord, e.currentTarget));
  }

  function onPassageActivate(e) {
    const w = e.target.closest('[data-vocab]');
    const s = e.target.closest('[data-ui="sentence"]');
    if (!s) return;
    if (+s.dataset.i !== cur) select(+s.dataset.i);
    else if (w) showWord(w.dataset.vocab);
  }
  el('passage').addEventListener('click', onPassageActivate);
  el('passage').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.vocab) onPassageActivate(e); });
  el('back').addEventListener('click', goHome);
  el('prev').addEventListener('click', () => select(cur - 1));
  el('next').addEventListener('click', () => select(cur + 1));
  el('speak').addEventListener('click', (e) => speak(sentences[cur].text, RATE.normal, e.currentTarget));
  el('speak-slow').addEventListener('click', (e) => speak(sentences[cur].text, RATE.slowSentence, e.currentTarget));
  bindMic(el('mic'), {
    onStart: () => { el('heard').classList.add('is-live'); el('heard').innerHTML = liveHtml('🎙️ Đang nghe… đọc xong máy sẽ tự dừng.'); },
    onInterim: (t) => { el('heard').innerHTML = liveHtml('🎙️ ' + t); },
    onResult: (alts) => {
      const res = compare(sentences[cur].text, alts);
      lastResult[cur] = res;
      if (res.heard) saveSentenceScore(topic.key, cur, res.score);
      renderPassage();
      renderStatus();
    },
    onError: (msg) => {
      el('notice-slot').innerHTML = `<div class="notice is-error" data-ui="notice" role="alert"><span aria-hidden="true">🎙️</span><span>${esc(msg)}</span></div>`;
      renderStatus();
    },
  });

  select(0);

  return {
    onKey(e) {
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'd') select(cur + 1);
      else if (k === 'arrowleft' || k === 'a') select(cur - 1);
      else if (k === 'l') el('speak').click();
      else if (k === 's') el('speak-slow').click();
      else if (k === 'm') el('mic').click();
      else if (k === 'escape') goHome();
    },
  };
}
