// Browser speech: text-to-speech (listen to a model) and speech recognition
// (check what you said). Both are built into the browser — no server, no key.
//
// ONE place decides the accent for both directions: British English, to
// match the Cambridge (UK) IPA shown on every card.
export const LANG = 'en-GB';

// ---------- TEXT-TO-SPEECH ----------
// Voice picking must work around inconsistent browser data: some voices
// report lang as "en_GB" (underscore) instead of "en-GB", and some only
// signal "British" through the voice NAME (e.g. "Google UK English Female",
// "Microsoft Sonia Online (Natural) - English (United Kingdom)", Apple's
// "Daniel"/"Kate"/"Serena"). Score each voice instead of taking the first
// loose match, so a real en-GB voice always wins over another English accent.
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [];
function refreshVoices() { voices = (synth && synth.getVoices()) || []; }
if (synth) { refreshVoices(); synth.onvoiceschanged = refreshVoices; }

function accentScore(v) {
  const lang = (v.lang || '').replace('_', '-').toLowerCase();
  const name = (v.name || '').toLowerCase();
  if (lang === LANG.toLowerCase()) return 3;
  if (name.includes('united kingdom') || name.includes('uk english') || /\b(uk|british|daniel|kate|serena|arthur|martha)\b/.test(name)) return 2;
  if (lang.startsWith('en')) return 1;
  return -1;
}
function pickVoice() {
  let best = null, bestScore = -1;
  for (const v of voices) { const s = accentScore(v); if (s > bestScore) { bestScore = s; best = v; } }
  return bestScore >= 0 ? best : null;
}

// Rates: 0.9 is the normal button. 0.1 is the Web Speech API's hard floor
// (spec range 0.1–10) — the 🐌 button for single words uses it. Whole
// sentences use a gentler slow rate, since 0.1 over 15 words is unusable.
export const RATE = { normal: 0.9, slowWord: 0.1, slowSentence: 0.5 };

export function stopSpeaking() { if (synth) synth.cancel(); }

export function speak(text, rate = RATE.normal, button = null) {
  if (!synth) { alert('Trình duyệt này chưa hỗ trợ đọc phát âm. Hãy thử Chrome hoặc Safari mới nhất.'); return; }
  if (!voices.length) refreshVoices(); // some browsers only populate voices lazily
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG;
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  if (button) {
    button.classList.add('speaking');
    u.onend = u.onerror = () => button.classList.remove('speaking');
  }
  synth.speak(u);
}

// ---------- SPEECH RECOGNITION ----------
// Chrome/Edge (desktop + Android) and Safari 14.5+ (macOS/iOS) support it;
// Firefox does not. Chrome sends audio to Google's servers, so it needs
// internet.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!Recognition;

const ERRORS = {
  'not-allowed': 'Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này rồi thử lại.',
  'service-not-allowed': 'Trình duyệt đang chặn nhận dạng giọng nói. Hãy bật quyền micro / Siri & Dictation rồi thử lại.',
  'audio-capture': 'Không tìm thấy micro.',
  network: 'Nhận dạng giọng nói cần kết nối mạng.',
};

// Starts one listening session. Returns { result, stop }:
//   result — Promise<string[]> of alternative transcripts ([] if silence)
//   stop   — ends listening early (result still resolves with what was heard)
export function listen({ onInterim } = {}) {
  const rec = new Recognition();
  rec.lang = LANG;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = false;
  let alternatives = [], error = null;

  const result = new Promise((resolve, reject) => {
    rec.onresult = (e) => {
      const results = Array.from(e.results);
      if (onInterim) onInterim(results.map(r => r[0].transcript).join(' '));
      const finals = results.filter(r => r.isFinal);
      if (!finals.length) return;
      alternatives = finals.length === 1
        ? Array.from(finals[0]).map(a => a.transcript)
        : [finals.map(r => r[0].transcript).join(' ')];
    };
    rec.onerror = (e) => { error = e.error; };
    rec.onend = () => {
      if (error && error !== 'no-speech' && error !== 'aborted') reject(new Error(ERRORS[error] || ('Lỗi nhận dạng: ' + error)));
      else resolve(alternatives);
    };
  });

  stopSpeaking(); // don't let the model voice get recorded as your answer
  rec.start();
  return { result, stop: () => rec.stop() };
}
