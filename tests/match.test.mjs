// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compare, checkWord, speakableVariants, parseSentence, tokenize } from '../js/match.js';

const load = (f) => JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url)));

test('perfect reading scores 100%', () => {
  const r = compare('She has curly hair.', ['she has curly hair']);
  assert.equal(r.score, 1);
  assert.ok(r.words.every(w => w.ok));
});

test('missed words are marked, others stay green', () => {
  const r = compare('He is almost bald now.', ['he is bold now']);
  assert.deepEqual(r.words.map(w => w.ok), [true, true, false, false, true]);
});

test('picks the best of several alternatives', () => {
  const r = compare('I saw a ship', ['I saw a sheep', 'I saw a ship']);
  assert.equal(r.score, 1);
  assert.equal(r.heard, 'I saw a ship');
});

test('British spellings match American transcripts', () => {
  for (const [uk, us] of [['neighbour', 'neighbor'], ['favourite', 'favorite'], ['colourful', 'colorful'],
    ['grey', 'gray'], ['centre', 'center'], ['snorkelling', 'snorkeling'], ['organise', 'organize']]) {
    assert.equal(compare(uk, [us]).score, 1, uk);
  }
});

test('digits match number words; hyphens and compounds are split/joined', () => {
  assert.equal(compare('get up at six', ['get up at 6']).score, 1);
  assert.equal(compare('face-to-face', ['face to face']).score, 1);
  assert.equal(compare('a tiny seahorse', ['a tiny sea horse']).score, 1);
});

test('minimal pairs are NOT merged by normalization', () => {
  for (const g of load('ipa.json').pairs) for (const [[a], [b]] of g.pairs) {
    assert.notDeepEqual(tokenize(a), tokenize(b), a + '/' + b);
  }
});

test('deck entries expand to sayable variants', () => {
  assert.deepEqual(speakableVariants('plump / stout'), ['plump', 'stout']);
  assert.deepEqual(speakableVariants('participate (in sth)'), ['participate']);
  assert.deepEqual(speakableVariants('light sth up'), ['light up']);
  assert.equal(checkWord('bridegroom / groom', ['groom']).ok, true);
  assert.equal(checkWord('bald', ['bold']).ok, false);
  assert.equal(checkWord('bald', []).ok, false);
});

test('passage markup parses into words with vocab links', () => {
  const s = parseSentence('We saw {dolphins|dolphin}, a {crab}.');
  assert.equal(s.text, 'We saw dolphins, a crab.');
  assert.deepEqual(s.words.map(w => w.vocab), [null, null, 'dolphin', null, 'crab']);
});

test('every passage marker links to a word in its topic deck', () => {
  const topics = load('topics.json'), passages = load('passages.json');
  for (const [key, p] of Object.entries(passages)) {
    const topic = topics.find(t => t.key === key);
    assert.ok(topic, 'unknown topic ' + key);
    const deck = new Set(topic.deck.map(c => c.word.toLowerCase()));
    for (const src of p.sentences) {
      for (const w of parseSentence(src).words) {
        if (w.vocab) assert.ok(deck.has(w.vocab.toLowerCase()), `${key}: "${w.vocab}" not in deck`);
      }
    }
  }
});

test('IPA data is complete: 44 sounds, pairs of two words', () => {
  const ipa = load('ipa.json');
  assert.equal(ipa.groups.flatMap(g => g.items).length, 44);
  for (const g of ipa.pairs) for (const pair of g.pairs) assert.equal(pair.length, 2, g.contrast);
});
