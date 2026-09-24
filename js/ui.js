// Shared UI pieces so every screen looks and behaves the same:
// escaping, topic theming, the bottom sheet, the mic button and toasts.
import { canListen, listen } from './speech.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Per-topic colors (derived by the flashcard skill's palette procedure and
// stored in topics.json) are applied as CSS variables on the page root.
const DEFAULT_THEME = {
  front: 'linear-gradient(150deg, #d3f3df 0%, #9ce5b7 55%, #69d892 100%)',
  back: 'linear-gradient(150deg, #b8eccb 0%, #88e0a8 55%, #57d385 100%)',
  accent: '#22c55e', accent1: '#1ca24d', accent2: '#22c55e', ink: '#0d4b24',
};
export function applyTheme(t = DEFAULT_THEME) {
  const s = document.documentElement.style;
  s.setProperty('--fc-front', t.front);
  s.setProperty('--fc-back', t.back);
  s.setProperty('--fc-accent', t.accent);
  s.setProperty('--fc-accent1', t.accent1);
  s.setProperty('--fc-accent2', t.accent2 || t.accent);
  s.setProperty('--card-ink', t.ink || '#0f172a');
}

// ---------- Bottom sheet (word details, phoneme details) ----------
let sheetEl = null;
export function openSheet(html) {
  closeSheet();
  sheetEl = document.createElement('div');
  sheetEl.className = 'sheet-backdrop';
  sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">
      <button class="sheet-close" type="button" aria-label="Đóng">✕</button>${html}</div>`;
  sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl || e.target.closest('.sheet-close')) closeSheet(); });
  document.body.appendChild(sheetEl);
  return sheetEl.querySelector('.sheet');
}
export function closeSheet() { if (sheetEl) { sheetEl.remove(); sheetEl = null; return true; } return false; }
export const sheetOpen = () => !!sheetEl;

// ---------- Mic button ----------
// Click once to start listening, click again to stop early. The browser also
// stops by itself after a short silence. onResult receives the recognizer's
// alternative transcripts (possibly empty).
export function bindMic(btn, { onResult, onInterim, onStart }) {
  let session = null;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!canListen) { alert('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome, Edge hoặc Safari.'); return; }
    if (session) { session.stop(); return; }
    session = listen({ onInterim });
    btn.classList.add('listening');
    if (onStart) onStart();
    try { onResult(await session.result); }
    catch (err) { alert(err.message); }
    finally { session = null; btn.classList.remove('listening'); }
  });
}

// Result line under a word: ✅ / ❌ plus what the machine actually heard.
export function resultHtml(ok, heard) {
  if (!heard) return '<span class="res bad">🤔 Máy chưa nghe thấy gì — thử nói to và rõ hơn.</span>';
  return `<span class="res ${ok ? 'ok' : 'bad'}">${ok ? '✅ Máy nghe đúng' : '❌ Máy nghe thành'}: “${esc(heard)}”</span>`;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
