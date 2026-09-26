// Home dashboard: welcome hero, "what to study today", today's words and a
// quick pronunciation drill. Everything comes from existing data/progress.
import { getStatus } from './store.js';
import { speak, RATE } from './speech.js';
import { checkWord } from './match.js';
import { $, esc, speakBtn, micBtn, bindMic, wordResult, liveHtml, result, openWordSheet } from './ui.js';

// Same word set all day, a new one tomorrow: seeded by the local date.
function dailyWords(topics, count = 3) {
  const all = topics.flatMap(t => t.deck.map(c => ({ c, t })));
  const pool = all.filter(({ c, t }) => getStatus(t.key, c.word) !== 'known');
  const list = pool.length >= count ? pool : all;
  const d = new Date();
  const seed = [...`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const step = Math.max(1, Math.floor(list.length / count));
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(seed + i * step) % list.length]);
}

// Illustration slot: shows the PNG when it exists, an emoji otherwise.
function art(src, alt, fallback) {
  return `<img src="${src}" alt="${esc(alt)}" data-fallback="${fallback}">`;
}
function bindArtFallbacks(root) {
  root.querySelectorAll('img[data-fallback]').forEach(img => img.addEventListener('error', () => {
    const span = document.createElement('span');
    span.className = 'art-fallback';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = img.dataset.fallback;
    img.replaceWith(span);
  }, { once: true }));
}

const WAVE = Array.from({ length: 28 }, (_, i) => 20 + Math.round(70 * Math.abs(Math.sin(i * 1.7)) * (0.5 + 0.5 * Math.abs(Math.cos(i * 0.6)))));

export function renderHome(root, data) {
  const words = dailyWords(data.topics);
  const unknown = data.topics.reduce((n, t) => n + t.deck.filter(c => getStatus(t.key, c.word) !== 'known').length, 0);
  const next = data.topics.find(t => t.deck.some(c => getStatus(t.key, c.word) !== 'known')) || data.topics[0];
  const pron = words[0];
  const tints = ['is-green', 'is-pink', 'is-blue'];

  root.innerHTML = `<div class="page-wide">
    <div class="home-grid">
      <section class="card hero" data-ui="hero">
        <div>
          <h1><span class="accent">Học tiếng Anh</span><br>dễ hơn mỗi ngày</h1>
          <ul><li>Từ vựng vững hơn</li><li>Phát âm tự tin hơn</li><li>Mỗi ngày một chút, tiến bộ thật nhiều!</li></ul>
          <a class="btn-primary" data-ui="start" href="#/flashcards/${esc(next.key)}">Bắt đầu học ngay →</a>
        </div>
        <div class="hero-art">${art('assets/illustrations/hero.png', 'Bạn nhỏ ôm sách tiếng Anh', '👩‍🎓')}</div>
      </section>

      <section class="card today-card" data-ui="today">
        <h2 class="card-title">🌱 Hôm nay học gì?</h2>
        <div class="today-list">
          <a class="today-item" href="#/flashcards"><span class="today-ico is-purple">📚</span><span class="today-text"><b>Học từ vựng</b><span>Còn ${unknown} từ chưa thuộc</span></span><span class="today-arrow">›</span></a>
          <a class="today-item" href="#/read"><span class="today-ico is-blue">🎤</span><span class="today-text"><b>Luyện đọc</b><span>Đọc to, máy chấm theo từng từ</span></span><span class="today-arrow">›</span></a>
          <a class="today-item" href="#/ipa"><span class="today-ico is-green">🔤</span><span class="today-text"><b>Phát âm IPA</b><span>44 âm giọng Anh, cặp âm dễ nhầm</span></span><span class="today-arrow">›</span></a>
        </div>
        <div class="mascot" aria-hidden="true">
          <div class="mascot-bubble">Học từ vựng và luyện phát âm siêu tiện luôn! ✨</div>
          <div class="mascot-art">${art('assets/illustrations/mascot.png', '', '🐥')}</div>
        </div>
      </section>

      <section class="card" data-ui="daily-words">
        <h2 class="card-title">✨ Từ vựng hôm nay <a href="#/flashcards">Xem tất cả ›</a></h2>
        <div class="word-cards">${words.map(({ c }, i) => `
          <div class="word-card ${tints[i % tints.length]}" data-ui="word-card" data-i="${i}" role="button" tabindex="0" aria-label="${esc(c.word)}: ${esc(c.vi)}">
            <span class="wc-word">${esc(c.word)}</span><span class="wc-pos">(${esc(c.pos)})</span><span class="wc-vi">${esc(c.vi)}</span>
            ${speakBtn()}
          </div>`).join('')}
        </div>
      </section>

      <section class="card" data-ui="quick-pron">
        <h2 class="card-title">🎙️ Luyện phát âm</h2>
        <div class="pron-word"><div><b>${esc(pron.c.word)}</b><div class="ipa">${esc(pron.c.ipa)}</div></div>
          <div class="pron-controls">${speakBtn()}${micBtn({ small: true })}</div></div>
        <div class="wave" data-ui="wave" aria-hidden="true">${WAVE.map((h, i) => `<span style="--h:${h}%;--d:${(i % 7) * 0.1}s"></span>`).join('')}</div>
        <div class="pron-result" data-ui="check-result"><p class="quiz-hint">Bấm 🎤 rồi đọc to từ ở trên.</p></div>
        <a class="btn-primary" href="#/read" style="width:100%">Luyện đọc cả câu →</a>
      </section>
    </div>
  </div>
`;

  bindArtFallbacks(root);

  root.querySelectorAll('[data-ui="word-card"]').forEach(card => {
    const c = words[+card.dataset.i].c;
    $(card, 'speak').addEventListener('click', (e) => { e.stopPropagation(); speak(c.tts || c.word, RATE.normal, e.currentTarget); });
    card.addEventListener('click', () => openWordSheet(c));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openWordSheet(c); });
  });

  const box = $(root, 'quick-pron');
  const wave = $(box, 'wave'), out = $(box, 'check-result');
  $(box, 'speak').addEventListener('click', (e) => speak(pron.c.tts || pron.c.word, RATE.normal, e.currentTarget));
  bindMic($(box, 'mic'), {
    onStart: () => { wave.classList.add('is-live'); out.innerHTML = liveHtml(`Đang nghe… hãy nói “${pron.c.word}”`); },
    onResult: (alts) => { wave.classList.remove('is-live'); const r = checkWord(pron.c.word, alts); out.innerHTML = wordResult(r.ok, r.heard); },
    onError: (msg) => { wave.classList.remove('is-live'); out.innerHTML = result('empty', esc(msg)); },
  });
  return {};
}
