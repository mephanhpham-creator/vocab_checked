// S4 IPA chart (44 British sounds + minimal pairs), S5 sound detail sheet
// (tip, examples, words from YOUR decks with that sound) and S6 minimal-pair
// sheet (listen & choose, then say each word).
import { speak, RATE } from './speech.js';
import { checkWord, speakableVariants } from './match.js';
import { $, esc, speakBtn, micBtn, bindMic, openSheet, result, wordResult, liveHtml } from './ui.js';

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

// One practice row: word + IPA + 🔊 + 🎤 + result. Shared by S5 and S6.
function rowHtml(i, word, ipa) {
  return `<div class="practice-row" data-ui="practice-row" data-i="${i}">
      <div><span class="w" data-ui="word">${esc(word)}</span><span class="ipa" data-ui="ipa">${esc(ipa)}</span></div>
      <div class="row-btns">${speakBtn()}${micBtn({ small: true })}</div>
      <div data-ui="result" style="grid-column:1 / -1" hidden></div>
    </div>`;
}
function bindRows(container, items) { // items: [{ word, say }]
  container.querySelectorAll('[data-ui="practice-row"]').forEach(row => {
    const it = items[+row.dataset.i];
    const out = $(row, 'result');
    const show = (html) => { out.hidden = false; out.innerHTML = html; };
    $(row, 'speak').addEventListener('click', (e) => speak(it.say, RATE.normal, e.currentTarget));
    bindMic($(row, 'mic'), {
      onStart: () => show(liveHtml(`Đang nghe… nói “${it.word}”`)),
      onResult: (alts) => { const r = checkWord(it.word, alts); show(wordResult(r.ok, r.heard)); },
      onError: (msg) => show(result('empty', esc(msg))),
    });
  });
}

function openPhoneme(item, vocab) {
  const examples = item.ex.map(([w, ipa]) => ({ word: w, ipa, say: w }));
  const mine = (vocab[item.p] || []).slice(0, 8).map(c => {
    const say = speakableVariants(c.word)[0] || c.word;
    return { word: say, ipa: c.ipa, say: c.tts || say };
  });
  const sheet = openSheet(`
    <div class="sheet-head"><div class="sheet-phoneme" data-ui="phoneme">/${esc(item.p)}/</div>
    <p class="sheet-tip" data-ui="tip">${esc(item.tip)}</p></div>
    <h4>Ví dụ</h4>${examples.map((x, i) => rowHtml(i, x.word, x.ipa)).join('')}
    ${mine.length ? `<h4>Từ trong kho của bạn</h4>${mine.map((x, i) => rowHtml(examples.length + i, x.word, x.ipa)).join('')}` : ''}`,
  { label: `Âm /${item.p}/` });
  bindRows(sheet, [...examples, ...mine]);
}

function openPairs(group) {
  const contrast = '/' + group.contrast.replace(/ \(.*\)/, '').replace(' – ', '/ – /') + '/';
  const flat = group.pairs.flat().map(([w, ipa]) => ({ word: w, ipa, say: w }));
  const sheet = openSheet(`
    <div class="sheet-head"><div class="sheet-phoneme" style="font-size:32px" data-ui="contrast">${esc(contrast)}</div>
    <p class="sheet-tip" data-ui="note">${esc(group.note)}</p></div>
    <h4>🎧 Nghe &amp; chọn</h4>
    <div class="quiz">
      <button class="btn-primary" type="button" data-ui="quiz-play">▶️ Phát một từ</button>
      <div class="quiz-choices">
        <button class="quiz-choice" type="button" data-ui="quiz-choice" disabled>?</button>
        <button class="quiz-choice" type="button" data-ui="quiz-choice" disabled>?</button>
        <button class="btn-icon" type="button" data-ui="quiz-replay" aria-label="Nghe lại" hidden>🔁</button>
      </div>
      <div data-ui="quiz-result"><p class="quiz-hint">Bấm “Phát một từ”, nghe kỹ rồi chọn từ bạn nghe được.</p></div>
    </div>
    <h4>🎤 Tự nói từng từ</h4>
    ${group.pairs.map((pair, pi) => `<div class="pair-block" data-ui="pair-block">${rowHtml(pi * 2, ...pair[0])}<div class="pair-vs">vs</div>${rowHtml(pi * 2 + 1, ...pair[1])}</div>`).join('')}`,
  { label: `Cặp âm ${contrast}` });
  bindRows(sheet, flat);

  // Listen & choose: play one word of a random pair, learner picks which.
  const choices = [...sheet.querySelectorAll('[data-ui="quiz-choice"]')];
  const replay = $(sheet, 'quiz-replay'), out = $(sheet, 'quiz-result');
  let answer = null, pair = null, answered = false;
  $(sheet, 'quiz-play').addEventListener('click', (e) => {
    pair = group.pairs[Math.floor(Math.random() * group.pairs.length)];
    answer = pair[Math.floor(Math.random() * 2)];
    answered = false;
    choices.forEach((b, i) => { b.disabled = false; b.className = 'quiz-choice'; b.textContent = pair[i][0]; });
    replay.hidden = false;
    out.innerHTML = '<p class="quiz-hint">Bạn nghe thấy từ nào?</p>';
    speak(answer[0], RATE.normal, e.currentTarget);
  });
  replay.addEventListener('click', (e) => { if (answer) speak(answer[0], RATE.normal, e.currentTarget); });
  choices.forEach((b, i) => b.addEventListener('click', () => {
    if (!answer || answered) return;
    answered = true;
    const picked = pair[i], ok = picked[0] === answer[0];
    choices.forEach((c, j) => {
      if (pair[j][0] === answer[0]) { c.classList.add('is-correct'); c.textContent = '✓ ' + pair[j][0]; }
      else if (j === i) { c.classList.add('is-wrong'); c.textContent = '✗ ' + pair[j][0]; }
    });
    out.innerHTML = ok
      ? result('correct', `<b>Chính xác</b> — đó là “${esc(answer[0])}” <span class="ipa">${esc(answer[1])}</span>`)
      : result('wrong', `<b>Chưa đúng</b> — máy đã phát “${esc(answer[0])}” <span class="ipa">${esc(answer[1])}</span>, bạn chọn “${esc(picked[0])}”. Nghe lại để so sánh.`);
  }));
}

export function renderIpa(root, ipa, topics) {
  const phonemes = phonemeList(ipa);
  const vocab = indexVocab(topics, phonemes);
  const items = ipa.groups.flatMap(g => g.items);

  root.innerHTML = `<div class="stack">
    ${ipa.groups.map(g => `
      <div class="ipa-group" data-ui="ipa-group"><h3 class="section-title">${esc(g.title)} <small>· ${g.items.length} âm</small></h3>
      <div class="ipa-grid">${g.items.map(it => `<button class="phoneme-tile" type="button" data-ui="phoneme-tile" data-p="${esc(it.p)}" aria-label="Âm /${esc(it.p)}/, ví dụ ${esc(it.ex[0][0])}"><span class="sym">${esc(it.p)}</span><span class="key">${esc(it.ex[0][0])}</span></button>`).join('')}</div></div>`).join('')}
    <div class="ipa-group"><h3 class="section-title">Cặp âm dễ nhầm <small>· ${ipa.pairs.length} cặp</small></h3>
    <div class="pair-grid">${ipa.pairs.map((g, i) => `<button class="pair-tile" type="button" data-ui="pair-tile" data-i="${i}"><span class="sym">${esc(g.contrast)}</span><span class="key">${esc(g.pairs[0][0][0])} / ${esc(g.pairs[0][1][0])}</span></button>`).join('')}</div></div>
  </div>`;

  root.querySelectorAll('[data-ui="phoneme-tile"]').forEach(b =>
    b.addEventListener('click', () => openPhoneme(items.find(it => it.p === b.dataset.p), vocab)));
  root.querySelectorAll('[data-ui="pair-tile"]').forEach(b =>
    b.addEventListener('click', () => openPairs(ipa.pairs[+b.dataset.i])));
}
