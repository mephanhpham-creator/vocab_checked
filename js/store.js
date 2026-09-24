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

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* in-memory only */ }
}

export async function loadData() {
  const get = (f) => fetch('data/' + f).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
  const [topics, passages, ipa] = await Promise.all([get('topics.json'), get('passages.json'), get('ipa.json')]);
  return { topics, passages, ipa };
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
