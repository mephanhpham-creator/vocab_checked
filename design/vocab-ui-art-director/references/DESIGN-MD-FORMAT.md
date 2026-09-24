# DESIGN-MD-FORMAT.md: how to write the final DESIGN.md

The final DESIGN.md follows the open **DESIGN.md** format (google-labs-code/design.md, spec version `alpha`), which both Google Stitch and Claude Design read. It has two parts:

1. **YAML front matter** between `---` lines: machine-readable tokens. These are the normative values.
2. **Markdown body**: 8 sections with `##` headings, **in this exact order**: Overview · Colors · Typography · Layout · Elevation & Depth · Shapes · Components · Do's and Don'ts. Consumers keep extra `##` sections, so this project appends **Topic Theming** and **Motion** after Do's and Don'ts.

## Token rules
- `colors`: hex `#RRGGBB`. At least `primary`. Recommended names: `primary`, `secondary`, `tertiary`, `neutral`, `surface`, `on-surface`, `error`. This project also needs `success`, `listening`, `muted`.
- `typography`: each level has `fontFamily`, `fontSize` (px/rem), `fontWeight` (number), `lineHeight` (a unitless number is preferred), and optionally `letterSpacing`. Aim for 9–12 levels.
- `rounded`: scale such as `sm`, `md`, `lg`, `xl`, `full` in px.
- `spacing`: scale such as `xs`, `sm`, `md`, `lg`, `xl`, plus `gutter` and `margin`.
- `components`: map of component name to properties (`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`). Values may reference tokens with `{colors.primary}`. Put variants under related keys: `button-mic`, `button-mic-listening`.
- Dimensions use `px`, `em` or `rem` only.

## Project-specific rules
- Fonts must cover Vietnamese and IPA (see PRODUCT.md). If the main font lacks IPA, add a separate `ipa` typography level with an IPA-capable family.
- Every text/background pair used in components must pass WCAG AA. List the key ratios in the Colors section.
- Feedback colours (`success`, `error`) are always paired with a non-colour cue, stated in Components.
- Per-topic colours: define the rule (how tint, card background and ink are derived from one accent) in **Topic Theming**, and list the 8 current accents as tokens `topic-<key>`.

## Template (fill every `<…>`; keep the order)

```markdown
---
version: alpha
name: <Direction name>
description: <One sentence mood>
colors:
  primary: "<#hex>"          # main action (e.g. primary buttons)
  secondary: "<#hex>"
  tertiary: "<#hex>"
  neutral: "<#hex>"          # page background
  surface: "<#hex>"          # cards, sheets
  on-surface: "<#hex>"       # body text
  muted: "<#hex>"            # secondary text
  success: "<#hex>"          # word heard correctly
  error: "<#hex>"            # word missed
  listening: "<#hex>"        # mic active
  topic-appearance: "#22c55e"
  topic-personality: "#8b5cf6"
  topic-celebration: "#d946ef"
  topic-housing: "#f59e0b"
  topic-sea_animals: "#06b6d4"
  topic-weather: "#ef4444"
  topic-emotions_opinions: "#4338ca"
  topic-leisure: "#9f1239"
typography:
  headline-lg: { fontFamily: <Font>, fontSize: <px>, fontWeight: <n>, lineHeight: <n> }
  headline-md: { … }
  title-md:    { … }          # topic card title, passage title
  body-lg:     { … }          # passage text (readable while speaking)
  body-md:     { … }
  body-sm:     { … }
  label-md:    { … }          # buttons, chips
  label-sm:    { … }          # badges, counters
  word-display: { … }         # flashcard headword
  ipa:         { fontFamily: <IPA-capable font>, … }
rounded:
  sm: <px>
  md: <px>
  lg: <px>
  xl: <px>
  full: 9999px
spacing:
  xs: <px>
  sm: <px>
  md: <px>
  lg: <px>
  xl: <px>
  gutter: <px>
  margin: 16px
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "<#hex>", typography: "{typography.label-md}", rounded: "{rounded.full}", padding: <px> }
  button-mic: { backgroundColor: "<…>", textColor: "<…>", size: <≥56px>, rounded: "{rounded.full}" }
  button-mic-listening: { backgroundColor: "{colors.listening}", textColor: "<#hex>" }
  button-icon: { size: 44px, rounded: "{rounded.full}", backgroundColor: "<…>" }
  chip: { … }
  chip-active: { … }
  topic-card: { rounded: "<…>", padding: <px> }
  flashcard: { rounded: "<…>", padding: <px>, height: <px> }
  word-ok: { backgroundColor: "<…>", textColor: "{colors.success}" }
  word-bad: { backgroundColor: "<…>", textColor: "{colors.error}" }
  result-pill: { rounded: "{rounded.md}", padding: <px>, typography: "{typography.body-sm}" }
  stat-tile: { backgroundColor: "{colors.surface}", rounded: "<…>", padding: <px> }
  bottom-sheet: { backgroundColor: "{colors.surface}", rounded: "<top radius>", padding: <px> }
  progress-bar: { height: <px>, rounded: "{rounded.full}" }
---

# <Direction name>

## Overview
<Personality, audience (Vietnamese IELTS learner on a phone), emotional goal: calm and encouraging. 1 paragraph.>

## Colors
<Each palette role in one line with its descriptive name. Then list key contrast pairs with ratio + PASS.>

## Typography
<Font choice and why; Vietnamese + IPA coverage; role of each level.>

## Layout
<Mobile-first single column, max width, margins, spacing rhythm, thumb-zone placement of the mic.>

## Elevation & Depth
<How hierarchy is shown: shadows / tonal layers / borders.>

## Shapes
<Corner language and where each radius is used.>

## Components
<Buttons (incl. mic idle/listening/disabled), chips/tabs, topic card, flashcard front/back, stat tile, progress bar, result pill (correct/wrong/nothing heard), word-ok/word-bad with non-colour cues, bottom sheet, toast.>

## Do's and Don'ts
- Do …
- Don't design login, leaderboards, ads or payment walls.
- Don't show sound-level scores (e.g. "/θ/ 62%"); the app only knows which words were heard.
- Don't rely on colour alone for correct/missed words.
- Don't use text smaller than 12px.
- Don't use stock photos of people.
- <every other "Must not" from PRODUCT.md, verbatim>

## Topic Theming
<Rule: given one topic accent, derive (1) a light tint for card backgrounds, (2) a medium tint for the flashcard back, (3) an ink colour for text that passes AA on both. State the rule so new topics can be added without a designer.>

## Motion
<Non-normative extension. Card flip (~0.5s), mic listening pulse, bottom-sheet slide-up, reduced-motion fallback.>
```
