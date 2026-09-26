// Shared UI pieces so every screen looks and behaves the same ("Sprout"
// design system, see design/DESIGN.md): escaping, element lookup by the
// data-ui contract, buttons, result pills, bottom sheet, mic wiring, toast.
import { canListen, listen, speak, RATE } from './speech.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Elements are found by their data-ui name, the contract shared with the
// design mockups (design/vocab-ui-art-director/references/SCREENS.md).
export const $ = (root, name) => root.querySelector(`[data-ui="${name}"]`);

// Per-topic colours: one accent in, tint/ink/border derived in CSS.
export const topicStyle = (topic) => `--topic-accent:${topic.accent}`;

const SVG = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON = {
  speaker: SVG('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
  mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
  micOff: SVG('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/><path d="M3 3l18 18"/>'),
};

export const speakBtn = () => `<button class="btn-icon" type="button" data-ui="speak" aria-label="Nghe phát âm" title="Nghe phát âm (L)">${ICON.speaker}</button>`;
export const slowBtn = () => `<button class="btn-icon" type="button" data-ui="speak-slow" aria-label="Nghe chậm" title="Nghe chậm (S)">🐌</button>`;
export const micBtn = ({ small = false } = {}) => canListen
  ? `<button class="btn-mic${small ? ' is-sm' : ''}" type="button" data-ui="mic" aria-label="Bấm để nói" aria-pressed="false" title="Nói để kiểm tra (M)">${ICON.mic}</button>`
  : `<button class="btn-mic${small ? ' is-sm' : ''}" type="button" data-ui="mic" aria-disabled="true" aria-label="Trình duyệt không hỗ trợ micro">${ICON.micOff}</button>`;

// ---------- Illustrations ----------
// Shows the image when it loads, an emoji otherwise, so a missing file never
// breaks the page. Call bindArtFallbacks(root) after inserting the HTML.
export const art = (src, alt, fallback) => `<img src="${src}" alt="${esc(alt)}" data-fallback="${fallback}">`;
export function bindArtFallbacks(root) {
  root.querySelectorAll('img[data-fallback]').forEach(img => img.addEventListener('error', () => {
    const span = document.createElement('span');
    span.className = 'art-fallback';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = img.dataset.fallback;
    img.replaceWith(span);
  }, { once: true }));
}
// The chick mascot cheering with a speech bubble (done states, perfect reads).
export const cheer = (html) => `<div class="cheer" data-ui="cheer"><div class="cheer-art">${art('assets/illustrations/mascot.webp', '', '🐥')}</div><div class="cheer-bubble">${html}</div></div>`;

// Page header for one topic: back link, icon, title, subtitle.
export function topicHead(topic, backLabel, sub) {
  return `<div class="topic-head">
    <button class="crumb" type="button" data-ui="back">← ${esc(backLabel)}</button>
    <div class="topic-head-main"><span class="topic-head-icon" aria-hidden="true">${topic.icon}</span>
      <div><h1 data-ui="topic-name">${esc(topic.title)}</h1><p>${esc(topic.subtitle || '')} · ${esc(sub)}</p></div></div>
  </div>`;
}

// ---------- Result pills ----------
export function result(kind, html) { // kind: correct | wrong | empty
  const icon = { correct: '✅', wrong: '❌', empty: '🤔' }[kind];
  return `<div class="result is-${kind}" role="status"><span aria-hidden="true">${icon}</span><span>${html}</span></div>`;
}
const nothingHeard = () => result('empty', '<b>Chưa nghe rõ</b>. Thử nói to và rõ hơn.');
export const wordResult = (ok, heard) => !heard ? nothingHeard()
  : ok ? result('correct', `<b>Chính xác</b>. Máy nghe được: “${esc(heard)}”`)
    : result('wrong', `<b>Máy nghe thành:</b> “${esc(heard)}”`);
export const liveHtml = (text) => `<div class="heard-live"><span class="live-dot" aria-hidden="true"></span><span>${esc(text)}</span></div>`;

// ---------- Bottom sheet ----------
let layer = null;
export function openSheet(html, { label = 'Chi tiết' } = {}) {
  closeSheet();
  layer = document.createElement('div');
  layer.className = 'sheet-layer';
  layer.innerHTML = `<div class="backdrop"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}" data-ui="sheet">
      <div class="sheet-handle" aria-hidden="true"></div>
      <button class="sheet-close" type="button" data-ui="sheet-close" aria-label="Đóng">✕</button>${html}</div>`;
  layer.addEventListener('click', (e) => { if (e.target.classList.contains('backdrop') || e.target.closest('[data-ui="sheet-close"]')) closeSheet(); });
  document.body.appendChild(layer);
  $(layer, 'sheet-close').focus();
  return $(layer, 'sheet');
}
// S7 word detail sheet: used from the reading passage and the home page.
export function openWordSheet(c) {
  const sheet = openSheet(`
    <div class="sheet-head"><div class="sheet-word" data-ui="word">${esc(c.word)}</div><div class="ipa sheet-center" data-ui="ipa">${esc(c.ipa)}</div></div>
    <div class="sheet-center"><div class="sheet-vi" data-ui="meaning-vi">${esc(c.vi)}</div><p class="sheet-en" data-ui="meaning-en">${esc(c.en)}</p></div>
    ${c.ex ? `<p class="sheet-example" data-ui="example">“${esc(c.ex)}”</p>` : ''}
    <div class="sheet-actions">${speakBtn()}${slowBtn()}</div>`, { label: `Nghĩa của từ ${c.word}` });
  $(sheet, 'speak').addEventListener('click', (e) => speak(c.tts || c.word, RATE.normal, e.currentTarget));
  $(sheet, 'speak-slow').addEventListener('click', (e) => speak(c.tts || c.word, RATE.slowWord, e.currentTarget));
}
export function closeSheet() { if (layer) { layer.remove(); layer = null; return true; } return false; }
export const sheetOpen = () => !!layer;

// ---------- Mic ----------
// Click once to start listening, again to stop early (the browser also stops
// after a short silence). onResult gets the recognizer's alternatives (maybe
// empty); onError gets a Vietnamese message (defaults to an alert).
const UNSUPPORTED = 'Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở trang bằng Chrome, Edge hoặc Safari để luyện nói.';
export function bindMic(btn, { onResult, onInterim, onStart, onError = (msg) => alert(msg) }) {
  let session = null;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!canListen) { onError(UNSUPPORTED); return; }
    if (session) { session.stop(); return; }
    session = listen({ onInterim });
    btn.classList.add('is-listening');
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Đang nghe, bấm để dừng');
    if (onStart) onStart();
    try { onResult(await session.result); }
    catch (err) { onError(err.message); }
    finally {
      session = null;
      btn.classList.remove('is-listening');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Bấm để nói');
    }
  });
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast is-floating';
  t.setAttribute('role', 'status');
  t.dataset.ui = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
