// Pure text-matching logic for the pronunciation check (no DOM, no browser
// APIs) so it can be unit-tested with `node --test`.
//
// The browser's speech recognizer returns *text*, not sounds. So "checking
// pronunciation" here means: did the recognizer hear the words you meant to
// say? Like a foreign friend who nods when they understood you — they can't
// tell you which sound was off, only whether the word got through.

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

// British spellings the (American-leaning) recognizer writes differently.
// Normalization is applied to BOTH sides of the comparison, so over-eager
// rules only matter if they merge two genuinely different words.
const SPELLING = {
  grey: 'gray', jewellery: 'jewelry', moustache: 'mustache', pyjamas: 'pajamas',
  programme: 'program', tyre: 'tire', mum: 'mom', ok: 'okay', practise: 'practice',
  practised: 'practiced', cheque: 'check', aluminium: 'aluminum',
};

export function canon(word) {
  let w = word.toLowerCase().replace(/[’‘]/g, "'").replace(/^'+|'+$/g, '');
  if (/^\d+$/.test(w) && +w < NUMBER_WORDS.length) return NUMBER_WORDS[+w];
  w = w.replace(/'s$/, 's');
  if (SPELLING[w]) return SPELLING[w];
  return w
    .replace(/(?<=[a-z]{3})our/, 'or')       // colour, favourite, neighbour, labour
    .replace(/is(e|ed|es|ing|ation)$/, 'iz$1') // organise, realised
    .replace(/(?<=[a-z]{3})tre$/, 'ter')     // centre, theatre
    .replace(/ll(?=[a-z])/, 'l');            // travelled, snorkelling
}

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9’'‘]+/g) || []).map(canon).filter(Boolean);
}

// The recognizer may split a compound ("sea horse") that the text writes as
// one word ("seahorse"). Re-join heard pairs when the joined form is a target.
function mergeCompounds(heard, targetSet) {
  const out = [];
  for (let i = 0; i < heard.length; i++) {
    const joined = heard[i] + (heard[i + 1] || '');
    if (i + 1 < heard.length && targetSet.has(joined) && !targetSet.has(heard[i])) { out.push(joined); i++; }
    else out.push(heard[i]);
  }
  return out;
}

// Longest-common-subsequence alignment: returns the set of target indices
// that were heard, in order.
function alignedIndices(target, heard) {
  const n = target.length, m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = target[i] === heard[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Set();
  for (let i = 0, j = 0; i < n && j < m;) {
    if (target[i] === heard[j]) { hit.add(i); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return hit;
}

// Compare a target text with the recognizer's alternatives.
// Returns per display word (whitespace-split, same split the UI uses) whether
// it was heard, plus an overall score in [0, 1] and the best alternative.
export function compare(targetText, alternatives) {
  const displayWords = targetText.split(/\s+/).filter(Boolean);
  const flat = [], owner = [];
  displayWords.forEach((w, wi) => tokenize(w).forEach(t => { flat.push(t); owner.push(wi); }));
  const targetSet = new Set(flat);

  let best = { hit: new Set(), heard: '' };
  for (const alt of alternatives) {
    const hit = alignedIndices(flat, mergeCompounds(tokenize(alt), targetSet));
    if (hit.size > best.hit.size || !best.heard) best = { hit, heard: alt };
  }

  const missed = new Set(owner.filter((_, ti) => !best.hit.has(ti)));
  return {
    words: displayWords.map((text, wi) => ({ text, ok: !missed.has(wi) })),
    score: flat.length ? best.hit.size / flat.length : 0,
    heard: best.heard.trim(),
  };
}

// A deck entry like "plump / stout", "participate (in sth)" or "throw sth"
// holds several sayable forms. Returns the forms a learner might say aloud.
export function speakableVariants(deckWord) {
  return deckWord.split('/')
    .map(v => v.replace(/\([^)]*\)/g, ' ').replace(/\b(sb|sth)\b/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// Single word/phrase check: passes when any sayable form was fully heard.
export function checkWord(deckWord, alternatives) {
  let best = null;
  for (const v of speakableVariants(deckWord)) {
    const r = compare(v, alternatives);
    if (!best || r.score > best.score) best = r;
  }
  return { ok: !!best && best.score === 1, heard: best ? best.heard : '' };
}

// Passage markup: {shown text|deck word} links a phrase to its flashcard
// entry; {text} alone when the text IS the deck word. Parses one marked-up sentence into display words (split on whitespace,
// the same split compare() uses) each tagged with its deck word, if any.
export function parseSentence(src) {
  const chars = [];
  const re = /\{([^}|]+)(?:\|([^}]+))?\}/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    for (const ch of src.slice(last, m.index)) chars.push([ch, null]);
    for (const ch of m[1]) chars.push([ch, m[2] || m[1]]);
    last = re.lastIndex;
  }
  for (const ch of src.slice(last)) chars.push([ch, null]);

  const words = [];
  let cur = null;
  for (const [ch, vocab] of chars) {
    if (/\s/.test(ch)) { cur = null; continue; }
    if (!cur) words.push(cur = { text: '', vocab: null });
    cur.text += ch;
    if (vocab) cur.vocab = vocab;
  }
  return { text: words.map(w => w.text).join(' '), words };
}
