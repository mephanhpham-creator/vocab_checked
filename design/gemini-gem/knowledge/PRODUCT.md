# PRODUCT.md: IELTS Vocab & Speaking

## What it is
A free, personal web app that combines three kinds of practice:
1. **Flashcards**: 8 IELTS topics, 273 words so far. Each card shows the word, part of speech, British IPA, an emoji, the Vietnamese meaning, an English definition, an example and synonyms.
2. **Read aloud**: one short passage per topic, written with that topic's words. The learner reads one sentence at a time into the mic. Words the machine heard turn green and missed words turn red, with a % score.
3. **IPA pronunciation**: a chart of the 44 British English sounds, each with a mouth tip, example words and words from the learner's own decks, plus minimal-pair drills (ship/sheep) with "listen & choose" and "say it".

## Who uses it
- One Vietnamese adult learner (possibly shared with friends later), preparing for IELTS.
- Studies **on a phone**, in short sessions (5–15 minutes), often one-handed. Sometimes uses a laptop with the keyboard.
- UI language is **Vietnamese**; learning content is **English**.

## How it works (limits the design must respect)
- Model audio is the browser's built-in **British English** voice (text-to-speech). There are no recorded audio files.
- The mic check uses the browser's speech recognition. It returns **the text it heard**, not sound-level scores. So feedback is "Máy nghe được: '…'" with each word marked heard (green) or missed (red), plus a % per sentence.
- Speech recognition works in Chrome, Edge and Safari; it **does not work in Firefox** and needs internet plus mic permission.
- Progress is saved on the device only (no accounts).
- Hosted as a static site on GitHub Pages (plain HTML/CSS/JS, no framework, no build step).

## Brand personality
Friendly, encouraging and calm; a study companion, not a game arcade. It celebrates progress without shaming mistakes: a red word means "try again", not "wrong!".

## Existing identity (can be kept or changed)
The current app uses a light green page gradient, rounded pastel cards, pill-shaped chips and emoji icons. Each topic has its own accent colour, which the learner uses to recognise topics at a glance:

| Topic key | Title (VI) | Subtitle (EN) | Icon | Accent | Ink (text on pastel) |
|---|---|---|---|---|---|
| appearance | Ngoại hình | Appearance | 🪞 | #22c55e | #0d4b24 |
| personality | Tính cách & Giao tiếp | Personality & Social | 🧠 | #8b5cf6 | #35235d |
| celebration | Sự kiện & Lễ kỷ niệm | Celebrations & Events | 🎉 | #d946ef | #521b5b |
| housing | Nhà cửa | Housing & Household | 🏠 | #f59e0b | #5d3c04 |
| sea_animals | Động vật biển | Sea Animals | 🌊 | #06b6d4 | #024551 |
| weather | Thời tiết & Khí hậu | Weather & Climate | 🌦️ | #ef4444 | #5b1a1a |
| emotions_opinions | Cảm xúc & Quan điểm | Emotions & Opinions | 🎭 | #4338ca | #19154d |
| leisure | Vui chơi giải trí | Leisure & Entertainment | 🎉 | #9f1239 | #3c0716 |

New topics will be added over time, so the per-topic colour must work as a **rule** (one accent in → light tint, card background and readable ink derived from it), not as 8 hand-picked one-offs.

## Must (hard constraints)
- Mobile-first: designed for 360–420px wide, and still usable on desktop (content max-width about 420–480px, centred).
- Touch targets at least 44×44px. The mic button is the most important control on the Read aloud screen.
- Fonts must render **Vietnamese diacritics** (ă â đ ê ô ơ ư + tone marks) and **IPA symbols**: `ɪ ʊ ə ʌ ɒ ɔ ɑ ɜ æ θ ð ʃ ʒ ŋ ː ˈ ˌ` (test string: `/ˈθɪŋk ðə ʃɪp ʒ ŋ ɜː ɑː ɔː ʊə/`).
- Body text contrast of at least WCAG AA (4.5:1). Green/red feedback must not rely on colour alone (add an icon, underline or pattern for colour-blind users).
- Per-topic accent colours are supplied as CSS variables at runtime.
- Plain HTML + CSS, no CSS framework and no CDN libraries. Fonts come from Google Fonts or the system stack.

## Must not (anti-references)
- No login screens, profile pages, leaderboards, streak shaming, ads or payment walls.
- No fake sound-level scoring ("your /θ/ is 62%"). The app cannot measure that.
- No dense, desktop-dashboard layouts; no tiny text under 12px.
- No dark patterns: no red badges nagging the learner to return.
- No stock photos of people; emoji or simple flat icons only.
