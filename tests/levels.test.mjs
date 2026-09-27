// Every built level file must be usable by the app: well-formed cards,
// passages whose marked words exist in their deck, and sentences that score
// 100% when read back exactly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { compare, parseSentence } from '../js/match.js';

const dir = new URL('../data/levels/', import.meta.url);
const levels = readdirSync(dir).filter(f => f.endsWith('.json'));

test('at least one level is built', () => assert.ok(levels.length > 0));

for (const file of levels) {
  const id = file.replace('.json', '');
  const { topics, passages } = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));

  test(`${id}: topics and cards are well formed`, () => {
    const keys = new Set();
    for (const t of topics) {
      assert.ok(t.key.startsWith(id + '_'), `${t.key} carries its level`);
      assert.ok(!keys.has(t.key), `${t.key} is unique`); keys.add(t.key);
      assert.ok(t.deck.length > 0 && t.deck.length <= 50, `${t.key} has 1–50 cards`);
      const words = new Set();
      for (const c of t.deck) {
        for (const f of ['word', 'pos', 'ipa', 'vi', 'en', 'ex']) assert.ok(c[f], `${t.key}/${c.word}: ${f}`);
        assert.match(c.ipa, /^\/[^/]+\/$/, `${c.word}: IPA between slashes`);
        assert.equal(c.level, id.toUpperCase());
        assert.ok(!words.has(c.word), `${t.key}: duplicate ${c.word}`); words.add(c.word);
      }
    }
  });

  test(`${id}: passages match their decks and score 100% when read exactly`, () => {
    for (const [key, p] of Object.entries(passages)) {
      const deck = new Set(topics.find(t => t.key === key).deck.map(c => c.word.toLowerCase()));
      for (const s of p.sentences) {
        const parsed = parseSentence(s);
        for (const w of parsed.words.filter(w => w.vocab)) assert.ok(deck.has(w.vocab.toLowerCase()), `${key}: ${w.vocab}`);
        assert.equal(compare(parsed.text, [parsed.text.replace(/[",.!?]/g, '')]).score, 1, parsed.text);
      }
    }
  });
}
