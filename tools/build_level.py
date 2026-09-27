#!/usr/bin/env python3
"""Build one CEFR level's data file from its hand-editable sources.

    python3 tools/build_level.py a2                      # -> data/levels/a2.json
    python3 tools/build_level.py a2 --fill-ipa brit.csv  # fill empty IPA cells first

Sources live in data/src/<level>/:
  cards.tsv      one card per row: word pos group emoji ipa vi en ex syn
  groups.json    ordered topic groups: key, title (vi), subtitle (en), icon, accent
  passages.json  reading passages keyed by final topic key (after splitting)

A group with more than MAX_DECK cards is split into equal parts
(<level>_<group>_1, _2, ...) so every deck stays a comfortable size.
Progress is keyed by topic key + word, so once a level ships, don't
reorder rows inside a split group — a word moving to another part loses
its known/unknown mark.

IPA: --fill-ipa takes Britfone (MIT, British RP, github.com/JoseLlarena/Britfone)
and writes Cambridge-style transcriptions into empty `ipa` cells. Words it
doesn't know are listed so they can be filled by hand.
"""
import csv, json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_DECK = 50
FIELDS = ['word', 'pos', 'group', 'emoji', 'ipa', 'vi', 'en', 'ex', 'syn']

# ---------- IPA ----------
VOWELS = {'iə', 'uə', 'ə', 'æ', 'ɑː', 'ɒ', 'ʌ', 'e', 'ɪ', 'i', 'iː', 'ʊ', 'uː', 'u', 'ɔː', 'ɜː',
          'eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'ɪə', 'eə', 'ʊə'}
# Britfone symbols -> Cambridge Dictionary conventions.
MAP = {'ɛ': 'e', 'ɛə': 'eə', 'ɐ': 'ʌ', 'ɹ': 'r', 'g': 'ɡ'}
ONSETS = {(c,) for c in 'p b t d k ɡ f v θ ð s z ʃ ʒ h tʃ dʒ m n l r w j'.split()} | {tuple(o.split()) for o in '''p l|b l|k l|ɡ l|f l|s l|p r|b r|t r|d r|k r|ɡ r|f r|θ r|ʃ r|t w|d w|k w|ɡ w|s w|θ w
  s m|s n|s p|s t|s k|s p l|s p r|s t r|s k r|s k w|p j|b j|t j|d j|k j|ɡ j|f j|v j
  m j|n j|h j|l j|s j|z j|θ j|s p j|s t j|s k j'''.replace('\n', '|').split('|') if o.strip()}


def brit_to_ipa(phones):
    """Britfone marks stress on the vowel; Cambridge marks it at the start of
    the syllable. Move each mark left past the longest legal onset.
    Cambridge also drops secondary stress after the main stress, and writes
    unstressed ɪə/ʊə as two vowels (stadium /ˈsteɪdiəm/)."""
    seq = []  # [symbol, stress]
    primary = False
    for ph in phones:
        stress = ''
        if ph[0] in 'ˈˌ':
            stress, ph = ph[0], ph[1:]
        if stress == 'ˌ' and primary:
            stress = ''
        primary = primary or stress == 'ˈ'
        ph = MAP.get(ph, ph)
        if not stress and ph in ('ɪə', 'ʊə'):
            ph = {'ɪə': 'iə', 'ʊə': 'uə'}[ph]
        seq.append([ph, stress])
    out = [s for s, _ in seq]
    # Cambridge writes a vowel-before-vowel ɪ as i (video /ˈvɪdiəʊ/).
    out = ['i' if s == 'ɪ' and not seq[k][1] and k + 1 < len(out) and out[k + 1] in VOWELS else s
           for k, s in enumerate(out)]
    marks = {}
    for i, (sym, stress) in enumerate(seq):
        if not stress:
            continue
        j = i  # start of onset
        while j > 0 and out[j - 1] not in VOWELS and tuple(out[j - 1:i]) in ONSETS:
            j -= 1
        marks[j] = stress
    ipa = ''.join(marks.get(i, '') + s for i, s in enumerate(out))
    ipa = re.sub('jʊ(?!ə)', 'jə', ipa)  # popular /ˈpɒpjələ/
    return re.sub('ɪti$', 'əti', ipa)    # activity /ækˈtɪvəti/


def load_britfone(path):
    d = {}
    for line in open(path, encoding='utf-8'):
        w, _, p = line.partition(',')
        w = re.sub(r'\(\d+\)$', '', w.strip()).lower()
        if w and w not in d:  # first variant = most common
            d[w] = brit_to_ipa(p.split())
    return d


def syllables(ipa):
    return len(re.findall('|'.join(sorted(VOWELS, key=len, reverse=True)), ipa))


def lookup_ipa(word, pos, brit):
    """One word: drop the mark on one-syllable words (/striːt/).
    Compound noun: main stress on the first word only (/ˈbʌs stɒp/).
    Other phrases: secondary on the first word, main on the last (/ˌsɪt ˈdaʊn/)."""
    parts = []
    if '-' in word and ' ' not in word:  # hyphenated: one written word
        parts = [lookup_ipa(t, 'noun' if pos.startswith('noun') else 'adj', brit) for t in word.split('-')]
        return None if None in parts else '/' + ''.join(p.strip('/') for p in parts) + '/'
    for tok in word.lower().split():
        tok = tok.strip("!?.'’")
        if tok not in brit:
            return None
        parts.append(brit[tok])
    if len(parts) == 1:
        return '/' + (parts[0].replace('ˈ', '') if syllables(parts[0]) == 1 else parts[0]) + '/'
    plain = [re.sub('[ˈˌ]', '', p) for p in parts]
    if pos.startswith('noun'):
        return '/' + ' '.join([parts[0]] + plain[1:]) + '/'
    first = parts[0].replace('ˈ', 'ˌ') if 'ˈ' in parts[0] else 'ˌ' + plain[0]
    return '/' + ' '.join([first] + plain[1:-1] + [parts[-1]]) + '/'


# ---------- build ----------
def read_cards(level):
    with open(ROOT / 'data/src' / level / 'cards.tsv', encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def write_cards(level, rows):
    with open(ROOT / 'data/src' / level / 'cards.tsv', 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, FIELDS, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)


def build(level):
    src = ROOT / 'data/src' / level
    rows = read_cards(level)
    groups = json.loads((src / 'groups.json').read_text(encoding='utf-8'))
    passages_path = src / 'passages.json'
    passages = json.loads(passages_path.read_text(encoding='utf-8')) if passages_path.exists() else {}

    known = {g['key'] for g in groups}
    errors = [f"{r['word']}: unknown group {r['group']}" for r in rows if r['group'] not in known]
    errors += [f"{r['word']}: missing {k}" for r in rows for k in ('pos', 'ipa', 'vi', 'en', 'ex') if not r[k].strip()]

    topics = []
    for g in groups:
        deck = [{'word': r['word'], 'pos': r['pos'], 'ipa': r['ipa'], 'emoji': r['emoji'], 'vi': r['vi'],
                 'en': r['en'], 'ex': r['ex'], 'syn': r['syn'] if r['syn'] != '—' else '', 'level': level.upper()}
                for r in rows if r['group'] == g['key']]
        words = [c['word'] for c in deck]
        errors += [f"{g['key']}: duplicate {w}" for w in set(words) if words.count(w) > 1]
        parts = max(1, math.ceil(len(deck) / MAX_DECK))
        size = math.ceil(len(deck) / parts)
        for p in range(parts):
            key = f"{level}_{g['key']}" + (f'_{p + 1}' if parts > 1 else '')
            topics.append({'key': key, 'level': level.upper(),
                           'title': g['title'] + (f' ({p + 1}/{parts})' if parts > 1 else ''),
                           'subtitle': g['subtitle'], 'icon': g['icon'], 'accent': g['accent'],
                           'deck': deck[p * size:(p + 1) * size]})

    keys = {t['key'] for t in topics}
    errors += [f'passage for unknown topic {k}' for k in passages if k not in keys]
    for k, p in passages.items():
        deck = {c['word'].lower() for t in topics if t['key'] == k for c in t['deck']}
        for s in p['sentences']:
            for m in re.finditer(r'\{([^}|]+)(?:\|([^}]+))?\}', s):
                if (m.group(2) or m.group(1)).lower() not in deck:
                    errors.append(f'{k}: "{m.group(2) or m.group(1)}" is not in the deck')
    if errors:
        sys.exit('\n'.join(errors))

    out = ROOT / 'data/levels' / f'{level}.json'
    out.write_text(json.dumps({'topics': topics, 'passages': passages}, ensure_ascii=False, separators=(',', ':')),
                   encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(topics)} topics, {sum(len(t["deck"]) for t in topics)} cards, '
          f'{len(passages)} passages')


if __name__ == '__main__':
    level = sys.argv[1]
    if '--fill-ipa' in sys.argv:
        brit = load_britfone(sys.argv[sys.argv.index('--fill-ipa') + 1])
        rows, missing = read_cards(level), []
        for r in rows:
            if not r['ipa'].strip():
                r['ipa'] = lookup_ipa(r['word'], r['pos'], brit) or ''
                if not r['ipa']:
                    missing.append(r['word'])
        write_cards(level, rows)
        print(f'IPA filled; {len(missing)} need a hand-written IPA:', ', '.join(missing))
    else:
        build(level)
