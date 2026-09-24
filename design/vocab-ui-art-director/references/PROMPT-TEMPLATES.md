# PROMPT-TEMPLATES.md

## A. Mood image (Gemini image generation): inspiration only
Use this to show the *feeling* of a direction. Mood images are not the final UI. Image models draw pixels: text may come out wrong (especially Vietnamese diacritics and IPA symbols) and nothing can be exported as code.

```
A clean UI mood board for a mobile English-learning app, shown as 3 iPhone-sized
screens side by side on a soft neutral background.
Style direction: <direction name>: <one-sentence mood>.
Palette: background <#hex>, surface <#hex>, text <#hex>, primary <#hex>,
success <#hex>, error <#hex>. Corner style: <sharp / soft 12px / pill>.
Depth: <flat / soft shadows / glass / tonal layers>. Typography feel: <geometric / rounded / humanist>.
Screen 1: a grid of 8 rounded topic cards, each tinted a different pastel colour with an emoji icon and a thin progress bar.
Screen 2: a large flashcard showing the English word "complexion", the IPA "/kəmˈplekʃən/", a speaker button and a microphone button.
Screen 3: a short reading passage where most words are highlighted green and one word is highlighted red, with a big round microphone button at the bottom.
Friendly, calm, encouraging; no people, no photos, no logos.
```

## B. Screen prompt (Claude Design or Google Stitch): the real UI
Run one prompt per screen group, with DESIGN.md already attached or set as the design system.

```
Follow the attached DESIGN.md exactly (tokens are normative).
Product context: <2 lines from PRODUCT.md>.

Design screen <S#: name> for a 390px-wide phone, content max-width 440px centred on desktop.
Language of UI copy: Vietnamese. Learning content: English. Use this real content:
<paste the sample content for this screen from SCREENS.md>

Draw ALL of these states as separate frames: <list states from SCREENS.md>.

UI contract (required): every element below must exist and carry the given
data-ui attribute, so developers can wire it to working code:
<paste the data-ui table rows for this screen>

Rules: plain HTML + CSS only (no frameworks, no CDN libraries except Google Fonts);
per-topic accent via CSS variable --topic-accent (and derived --topic-tint, --topic-ink);
touch targets ≥ 44px; the mic button is the primary action; correct/missed words
use colour AND a non-colour cue; text ≥ 12px; WCAG AA contrast.
Do not add features not listed (no login, no leaderboard, no sound-level scores).
```

Shared components first: before S1–S7, run this once so every screen reuses the same parts:

```
Follow the attached DESIGN.md. Create a component sheet (one page) with every
shared component and all its states, as listed in SCREENS.md → "Shared components":
speak/slow buttons, mic button (idle, listening, disabled), result pill (correct,
wrong "Máy nghe thành: …", nothing heard), chip/tab (default, active), stat tile,
progress bar (0%, 40%, 100%), bottom sheet, toast, and one topic card tinted with
each of the 8 topic accents.
```

## C. Illustration assets (Gemini image generation): optional
Only if the chosen direction uses illustrations instead of emoji (for example a mascot, or topic icons).

```
A set of 8 flat, rounded, friendly icons in one consistent style, <direction style>,
each on a transparent background, 512×512, no text:
1 mirror (appearance), 2 brain with speech bubble (personality & social),
3 party popper (celebrations), 4 house (housing), 5 wave with a fish (sea animals),
6 sun behind cloud with rain (weather), 7 theatre masks (emotions & opinions),
8 bicycle and paint palette (leisure).
Main colours per icon: <topic accents>.
```
