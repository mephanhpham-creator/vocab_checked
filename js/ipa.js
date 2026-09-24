// IPA practice: the 44-sound British chart (tap a sound → tip, examples,
// words from YOUR decks that contain it) and minimal pairs (listen & choose,
// then say each word).
import { speak, RATE } from './speech.js';
import { checkWord, speakableVariants } from './match.js';
import { bindMic, openSheet, resultHtml, esc } from './ui.js';

// Multi-character phonemes first so "tʃ" isn't read as "t" + "ʃ".
function phonemeList(ipa) { return ipa.groups.flatMap(g => g.items.map(i => i.p)).sort((a, b) => b.length - a.length); }

// Splits an IPA transcription into phonemes. Normalizes ASCII g → IPA ɡ and
// drops stress marks, slashes and "(r)". An "r" not followed by a vowel is the
// linking r of non-rhotic British IPA (e.g. /heər/), not a real /r/, so skip it.
export function splitIpa(transcription, phonemes) {
  const s = transcription.replace(/g/g, 'ɡ').replace(/\(r\)/g, '').replace(/[ˈˌ/.,()]/g, ' ');
  const vowelStart = new Set('iɪeæɑɒɔʊuʌɜəaoɛ');
  const out = [];
  for (let i = 0; i < s.length;) {
    const p = phonemes.find(ph => s.startsWith(ph, i));
    if (!p) { i++; continue; }
    const nextCh = s[i + p.length];
    if (!(p === 'r' && !vowelStart.has(nextCh))) out.push(p);
    i += p.length;
  }
  return out;
}

// phoneme -> [deck cards containing it], across every topic.
function indexVocab(topics, phonemes) {
  const idx = {};
  for (const t of topics) for (const c of t.deck) {
    for (const p of new Set(splitIpa(c.ipa || '', phonemes))) (idx[p] || (idx[p] = [])).push(c);
  }
  return idx;
}

// One practice row: word + IPA + 🔊 + 🎤 + result. Used by both sheets.
function rowHtml(i, word, ipa) {
  return `<div class="prac-row" data-i="${i}">
      <div class="prac-word"><b>${esc(word)}</b> <span class="ipa-inline">${esc(ipa)}</span></div>
      <div class="prac-btns"><button class="speak-btn" data-act="speak">🔊</button><button class="speak-btn mic-btn" data-act="mic">🎤</button></div>
      <div class="prac-result"></div>
    </div>`;
}
function bindRows(container, items) { // items: [{ word, say }]
  container.querySelectorAll('.prac-row').forEach(row => {
    const it = items[+row.dataset.i];
    row.querySelector('[data-act=speak]').addEventListener('click', (e) => speak(it.say, RATE.normal, e.currentTarget));
    bindMic(row.querySelector('[data-act=mic]'), {
      onStart: () => { row.querySelector('.prac-result').innerHTML = '<span class="res">🎙️ Đang nghe…</span>'; },
      onResult: (alts) => { const r = checkWord(it.word, alts); row.querySelector('.prac-result').innerHTML = resultHtml(r.ok, r.heard); },
    });
  });
}

function openPhoneme(item, vocab) {
  const examples = item.ex.map(([w, ipa]) => ({ word: w, ipa, say: w }));
  const mine = (vocab[item.p] || []).slice(0, 8).map(c => ({ word: speakableVariants(c.word)[0] || c.word, ipa: c.ipa, say: c.tts || speakableVariants(c.word)[0] || c.word }));
  const all = [...examples, ...mine];
  const sheet = openSheet(`
    <div class="sheet-phoneme">/${esc(item.p)}/</div>
    <div class="sheet-tip">${esc(item.tip)}</div>
    <h4>Ví dụ</h4>
    ${examples.map((x, i) => rowHtml(i, x.word, x.ipa)).join('')}
    ${mine.length ? `<h4>Từ trong kho của bạn</h4>${mine.map((x, i) => rowHtml(examples.length + i, x.word, x.ipa)).join('')}` : ''}`);
  bindRows(sheet, all);
}

function openPairs(group) {
  const flat = group.pairs.flat().map(([w, ipa]) => ({ word: w, ipa, say: w }));
  const sheet = openSheet(`
    <div class="sheet-phoneme small">/${esc(group.contrast.replace(/ \(.*\)/, '').replace(' – ', '/ – /'))}/</div>
    <div class="sheet-tip">${esc(group.note)}</div>
    <h4>🎧 Nghe & chọn</h4>
    <div class="quiz">
      <button class="chip active" id="quizPlay">▶️ Phát một từ</button>
      <div class="quiz-options" id="quizOptions"></div>
      <div class="quiz-result" id="quizResult"></div>
    </div>
    <h4>🎤 Tự nói từng từ</h4>
    ${group.pairs.map((pair, pi) => `<div class="pair-block">${pair.map(([w, ipa], k) => rowHtml(pi * 2 + k, w, ipa)).join('')}</div>`).join('')}`);
  bindRows(sheet, flat);

  // Listen & choose: play one word of a random pair, learner picks which.
  let answer = null, pair = null;
  const opts = sheet.querySelector('#quizOptions'), res = sheet.querySelector('#quizResult');
  sheet.querySelector('#quizPlay').addEventListener('click', (e) => {
    pair = group.pairs[Math.floor(Math.random() * group.pairs.length)];
    answer = pair[Math.floor(Math.random() * 2)][0];
    speak(answer, RATE.normal, e.currentTarget);
    res.innerHTML = '';
    opts.innerHTML = pair.map(([w]) => `<button class="mark-btn choice" data-w="${esc(w)}">${esc(w)}</button>`).join('')
      + '<button class="speak-btn" id="quizReplay" title="Nghe lại">🔁</button>';
    opts.querySelector('#quizReplay').addEventListener('click', (ev) => speak(answer, RATE.normal, ev.currentTarget));
  });
  opts.addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (!b || !answer) return;
    const ok = b.dataset.w === answer;
    const ipa = pair.find(([w]) => w === answer)[1];
    res.innerHTML = `<span class="res ${ok ? 'ok' : 'bad'}">${ok ? '✅ Chính xác' : '❌ Chưa đúng'} — đó là “${esc(answer)}” ${esc(ipa)}</span>`;
  });
}

export function renderIpa(root, ipa, topics) {
  const phonemes = phonemeList(ipa);
  const vocab = indexVocab(topics, phonemes);
  const items = ipa.groups.flatMap(g => g.items);

  root.innerHTML = `
    ${ipa.groups.map(g => `
      <h3 class="section-title">${esc(g.title)}</h3>
      <div class="ipa-grid">${g.items.map(it => `
        <button class="ipa-tile" data-p="${esc(it.p)}">
          <span class="ipa-sym">${esc(it.p)}</span>
          <span class="ipa-key">${esc(it.ex[0][0])}</span>
        </button>`).join('')}
      </div>`).join('')}
    <h3 class="section-title">Cặp âm dễ nhầm</h3>
    <div class="pair-grid">${ipa.pairs.map((g, i) => `
      <button class="pair-tile" data-i="${i}">
        <span class="pair-sym">${esc(g.contrast)}</span>
        <span class="ipa-key">${esc(g.pairs[0][0][0])} / ${esc(g.pairs[0][1][0])}</span>
      </button>`).join('')}
    </div>`;

  root.querySelectorAll('.ipa-tile').forEach(b =>
    b.addEventListener('click', () => openPhoneme(items.find(it => it.p === b.dataset.p), vocab)));
  root.querySelectorAll('.pair-tile').forEach(b =>
    b.addEventListener('click', () => openPairs(ipa.pairs[+b.dataset.i])));
}
