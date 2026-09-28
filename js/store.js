// Data loading + progress persistence.
//
// Progress lives in localStorage: a notebook the browser keeps on this device
// only. Every read/write is wrapped in try/catch — in private mode or a
// sandbox that blocks storage, progress simply stays in memory for the
// session instead of crashing the app.

// Same key and shape as the original Netlify flashcard app
// ({ topicKey: { word: 'known' | 'unknown' } }), so imported progress fits.
const PROGRESS_KEY = 'ielts_vocab_progress_v1';
// { topicKey: { sentenceIndex: bestScore0to1 } }
const READING_KEY = 'ielts_reading_v1';
// 'a2' | 'b1' | ... | 'ielts': the level chosen in the level picker.
const LEVEL_KEY = 'vocab_level_v1';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* in-memory only */ }
}

const get = (f) => fetch('data/' + f).then(r => { if (!r.ok) throw new Error(f); return r.json(); });

export const loadIpa = () => get('ipa.json');

// ---------- Levels ----------
// Each CEFR level is its own file (data/levels/<id>.json, built by
// tools/build_level.py), fetched only when that level is opened — like
// taking one volume off the shelf instead of carrying the whole set.
// `ready: false` levels show a "coming soon" note instead of topics.
export const LEVELS = [
  { id: 'a2', label: 'A2', name: 'Sơ cấp', ready: true },
  { id: 'b1', label: 'B1', name: 'Trung cấp', ready: false, soon: 'Bộ từ B1 đang được soạn, sẽ có sớm.' },
  { id: 'b2', label: 'B2', name: 'Trung cao cấp', ready: false, soon: 'Bộ từ B2 đang được soạn, sẽ có sớm.' },
  { id: 'c1', label: 'C1', name: 'Cao cấp', ready: false, soon: 'Bộ từ C1 đang được soạn, sẽ có sớm.' },
  { id: 'c2', label: 'C2', name: 'Thành thạo', ready: false, soon: 'Bộ từ C2 sẽ được thêm khi có danh sách từ C2.' },
  { id: 'ielts', label: 'IELTS', name: 'Chủ đề IELTS', ready: true },
];
export const levelInfo = (id) => LEVELS.find(l => l.id === id);

const levelCache = {};
export function loadLevel(id) {
  if (!levelCache[id]) {
    levelCache[id] = (id === 'ielts'
      ? Promise.all([get('topics.json'), get('passages.json')]).then(([topics, passages]) => ({ topics, passages }))
      : get(`levels/${id}.json`).then(data => { carryOverMarks(id, data.topics); return data; })
    ).catch(e => { delete levelCache[id]; throw e; }); // allow a retry after a network error
  }
  return levelCache[id];
}

// Topic keys carry their level (a2_food_1); the original IELTS topics have none.
export const levelOf = (topicKey) => (topicKey.match(/^(a2|b1|b2|c1|c2)_/) || [, 'ielts'])[1];

// Default: returning learners with IELTS progress keep seeing IELTS; new ones start at A2.
let level = (() => {
  let id = null;
  try { id = localStorage.getItem(LEVEL_KEY); } catch (e) { /* storage blocked */ }
  if (levelInfo(id)) return id;
  return Object.keys(read(PROGRESS_KEY)).some(k => levelOf(k) === 'ielts') ? 'ielts' : 'a2';
})();
export const getLevel = () => level;
export function setLevel(id) {
  level = id;
  try { localStorage.setItem(LEVEL_KEY, id); } catch (e) { /* in-memory only */ }
}

// ---------- Flashcard status ----------
const progress = read(PROGRESS_KEY);

export function getStatus(topicKey, word) { return (progress[topicKey] || {})[word] || null; }

export function setStatus(topicKey, word, status) {
  const t = progress[topicKey] || (progress[topicKey] = {});
  if (status) t[word] = status; else delete t[word];
  write(PROGRESS_KEY, progress);
}

export function resetTopic(topicKey) { delete progress[topicKey]; write(PROGRESS_KEY, progress); }

export function knownCount(topic) { return topic.deck.filter(c => getStatus(topic.key, c.word) === 'known').length; }

// When a level's decks are reorganised (A2 was first split by count, then
// by meaning), marks saved under a deck key that no longer exists move to
// the deck that now holds the same word, like forwarding mail after a move.
// Reading scores of a removed deck belong to a passage that is gone, so
// they are dropped.
function carryOverMarks(levelId, topics) {
  const keys = new Set(topics.map(t => t.key));
  const stale = Object.keys(progress).filter(k => levelOf(k) === levelId && !keys.has(k));
  for (const old of stale) {
    for (const [word, status] of Object.entries(progress[old])) {
      const target = topics.find(t => t.deck.some(c => c.word === word) && !getStatus(t.key, word));
      if (target) (progress[target.key] || (progress[target.key] = {}))[word] = status;
    }
    delete progress[old];
  }
  const staleReading = Object.keys(reading).filter(k => levelOf(k) === levelId && !keys.has(k));
  staleReading.forEach(k => delete reading[k]);
  if (stale.length) write(PROGRESS_KEY, progress);
  if (staleReading.length) write(READING_KEY, reading);
}

// ---------- Reading scores ----------
const reading = read(READING_KEY);

export function getSentenceScore(topicKey, i) { return (reading[topicKey] || {})[i]; }

export function saveSentenceScore(topicKey, i, score) {
  const t = reading[topicKey] || (reading[topicKey] = {});
  if (t[i] === undefined || score > t[i]) { t[i] = score; write(READING_KEY, reading); }
}

// Average of best scores; sentences never read count as 0.
export function passageScore(topicKey, sentenceCount) {
  const t = reading[topicKey] || {};
  let sum = 0;
  for (let i = 0; i < sentenceCount; i++) sum += t[i] || 0;
  return sentenceCount ? sum / sentenceCount : 0;
}

// ---------- One-time import from the old Netlify app ----------
// The old site redirects here with its progress in the URL: #import=<base64url JSON>.
// Local marks win; imported ones only fill words not marked here yet.
export function importFromHash() {
  const m = location.hash.match(/^#import=([\w-]+)/);
  if (!m) return null;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const incoming = JSON.parse(new TextDecoder().decode(bytes));
    let added = 0;
    for (const [topicKey, words] of Object.entries(incoming)) {
      for (const [word, status] of Object.entries(words || {})) {
        if ((status === 'known' || status === 'unknown') && !getStatus(topicKey, word)) {
          (progress[topicKey] || (progress[topicKey] = {}))[word] = status;
          added++;
        }
      }
    }
    write(PROGRESS_KEY, progress);
    return added;
  } catch (e) { return null; }
}
