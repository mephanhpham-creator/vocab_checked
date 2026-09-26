---
version: alpha
name: Sprout
description: Warm, playful learning-app look (cream background, leaf-green actions, rounded display type, pastel word cards, illustrated hero and mascot) for Vietnamese IELTS learners. Evolves "Fresh Sorbet".
colors:
  primary: "#2E7D32"          # Leaf green: primary buttons, active nav, idle mic (white text on it 5.13:1; on cream 4.86:1 PASS)
  primary-strong: "#1B5E20"   # Brand name and page headings (on cream 7.45:1)
  secondary: "#3B82F6"        # Xanh dương phụ trợ
  tertiary: "#F5B301"         # Sunny yellow: decorative sparkles and glows only, never text
  neutral: "#FFF8EC"          # Cream page background, soft gradient to #F3F9EC
  surface: "#FFFFFF"          # Bề mặt thẻ, sheet, hộp thoại
  on-surface: "#1F2937"       # Body text (on white 14.68:1 PASS)
  muted: "#4B5563"            # Secondary text (on white 7.56:1 PASS)
  success: "#15803D"          # Word heard correctly (on white 5.02:1 PASS)
  error: "#B91C1C"            # Word missed (on white 6.47:1; on its 12% tint 5.28:1 PASS)
  listening: "#EA580C"        # Mic-active background only; white icon on it 3.56:1 (PASS for UI graphics, never use as text colour)
  topic-appearance: "#22C55E"
  topic-personality: "#8B5CF6"
  topic-celebration: "#D946EF"
  topic-housing: "#F59E0B"
  topic-sea_animals: "#06B6D4"
  topic-weather: "#EF4444"
  topic-emotions_opinions: "#4338CA"
  topic-leisure: "#9F1239"
typography:
  headline-lg: { fontFamily: "Baloo 2, Nunito, sans-serif", fontSize: "34px", fontWeight: 800, lineHeight: 1.25 }
  headline-md: { fontFamily: "Baloo 2, Nunito, sans-serif", fontSize: "28px", fontWeight: 800, lineHeight: 1.3 }
  title-md:    { fontFamily: "Nunito, sans-serif", fontSize: "18px", fontWeight: 600, lineHeight: 1.35 }
  body-lg:     { fontFamily: "Nunito, sans-serif", fontSize: "18px", fontWeight: 400, lineHeight: 1.6 }
  body-md:     { fontFamily: "Nunito, sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: 1.5 }
  body-sm:     { fontFamily: "Nunito, sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: 1.4 }
  label-md:    { fontFamily: "Nunito, sans-serif", fontSize: "15px", fontWeight: 600, lineHeight: 1.2 }
  label-sm:    { fontFamily: "Nunito, sans-serif", fontSize: "12px", fontWeight: 600, lineHeight: 1.2 }
  word-display: { fontFamily: "Nunito, sans-serif", fontSize: "32px", fontWeight: 800, lineHeight: 1.2 }
  ipa:         { fontFamily: "Noto Sans, sans-serif", fontSize: "18px", fontWeight: 400, lineHeight: 1.4 }
rounded:
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  gutter: "16px"
  margin: "16px"
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "#FFFFFF", typography: "{typography.label-md}", rounded: "{rounded.full}", padding: "14px", height: "48px" }
  button-mic: { backgroundColor: "{colors.primary}", textColor: "#FFFFFF", size: "64px", rounded: "{rounded.full}" }
  button-mic-listening: { backgroundColor: "{colors.listening}", textColor: "#FFFFFF", size: "64px", rounded: "{rounded.full}" }
  button-icon: { size: "48px", rounded: "{rounded.full}", backgroundColor: "rgba(15, 118, 110, 0.1)", textColor: "{colors.primary}" }
  chip: { backgroundColor: "rgba(0, 0, 0, 0.05)", textColor: "{colors.muted}", rounded: "{rounded.full}", padding: "8px", height: "36px", typography: "{typography.label-sm}" }
  chip-active: { backgroundColor: "{colors.primary}", textColor: "#FFFFFF", rounded: "{rounded.full}", padding: "8px", height: "36px", typography: "{typography.label-sm}" }
  topic-card: { rounded: "{rounded.xl}", padding: "18px", backgroundColor: "{colors.surface}" }
  flashcard: { rounded: "{rounded.xl}", padding: "24px", height: "380px", backgroundColor: "{colors.surface}" }
  word-ok: { backgroundColor: "rgba(22, 163, 74, 0.15)", textColor: "#166534", rounded: "{rounded.sm}", padding: "2px" }
  word-bad: { backgroundColor: "rgba(185, 28, 28, 0.12)", textColor: "{colors.error}", rounded: "{rounded.sm}", padding: "2px" }
  result-pill: { rounded: "{rounded.md}", padding: "12px", typography: "{typography.body-sm}" }
  stat-tile: { backgroundColor: "{colors.surface}", rounded: "{rounded.md}", padding: "12px" }
  bottom-sheet: { backgroundColor: "{colors.surface}", rounded: "{rounded.xl}", padding: "24px" }   # top corners only, see Shapes
  progress-bar: { height: "8px", rounded: "{rounded.full}", backgroundColor: "rgba(0, 0, 0, 0.08)" }
---

# Sprout

## Overview
A cheerful, modern, and non-intimidating mobile study companion designed specifically for Vietnamese adult learners preparing for IELTS speaking. The visual language uses soft ambient mesh gradients (warm cream blending into cool mint), spacious rounded surfaces, multi-coloured pastel topic tags, and pill contours. It fosters positive reinforcement: making speech errors feels like low-stakes play rather than a formal test.

## Colors
- **primary (`#2E7D32`)**: Leaf green for primary buttons, the active nav item and the idle mic. On white 5.13:1, on cream 4.86:1; white text on it 5.13:1 (PASS AA). `primary-strong` (`#1B5E20`) for the brand name and page headings.
- **neutral (`#FFF8EC`)**: Warm cream page background, blending into light leaf (`#F3F9EC`).
- **Pastel word cards**: green `#EAF5E4`/ink `#2E7D32` (4.56:1), pink `#FDEEF3`/ink `#BE185D` (5.38:1), blue `#EAF1FC`/ink `#1D4ED8` (5.90:1); icon tiles also use purple `#F3EEFE`.
- **surface (`#FFFFFF`)**: Pure crisp white for elevated cards, bottom sheets, and tiles.
- **on-surface (`#1F2937`)**: Neutral charcoal for high-contrast, crisp typography. Contrast on white: 14.68:1 (PASS AA).
- **muted (`#4B5563`)**: Cool grey for secondary labels and hints. Contrast on white: 7.56:1 (PASS AA).
- **success (`#15803D`)**: Leaf green for correct feedback (icons, result pills). On white 5.02:1 (PASS AA). Inside the light-green `word-ok` highlight the text uses the deeper `#166534` (6.03:1 on the tint).
- **error (`#B91C1C`)**: Strawberry red for missed words. On white 6.47:1; on its 12% tint 5.28:1 (PASS AA).
- **listening (`#EA580C`)**: Amber orange for the active mic background only. White icon on it is 3.56:1, which passes the 3:1 rule for UI graphics. Never use it as a text colour (3.56:1 on white fails AA for text).
- **Per-topic accents**: 8 distinct pastel accents representing curriculum themes.

## Typography
- **Display typeface**: `Baloo 2` 700–800 for the hero headline, page titles and brand name: rounded and friendly. Verified: full Vietnamese coverage.
- **Body typeface**: `Nunito` 400–800: rounded sans, verified full Vietnamese coverage.
- **Phonetic IPA typeface**: `Noto Sans` (Google Fonts). Verified to contain every IPA glyph the app uses (`ɪ ʊ ə ʌ ɒ ɔ ɑ ɜ æ θ ð ʃ ʒ ŋ ː ˈ ˌ`) plus Vietnamese. Nunito and Baloo 2 are not relied on for IPA, and Charis SIL as served by Google Fonts lacks `θ ː ˈ ˌ`, so neither may render IPA.
- Minimum body text is set to 13px (strictly exceeds the 12px absolute minimum limit).

## Layout
- Mobile-first single column optimized for 360–420px viewports. Centred with a maximum width of 440px on tablet/desktop displays.
- Generous touch gutters of 16px and vertical stack rhythm of 12–20px.
- The primary microphone button is prominently anchored in the lower thumb zone (bottom center) on speaking screens to facilitate seamless one-handed interaction.

## Elevation & Depth
- Layering is achieved via soft, expansive diffused shadows: `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)`.
- Cards sit atop the background gradient with a subtle 1px border: `border: 1px solid rgba(0, 0, 0, 0.05)`.
- Modal bottom sheets introduce a semi-translucent backdrop overlay (`rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(4px)`).

## Shapes
- Signature corner language features extra-large radiuses (`rounded.xl: 28px` for topic cards and flashcards; the bottom sheet uses it on its **top corners only**, bottom corners 0).
- Micro-elements (buttons, tags, chips, status pills) use full pill radiuses (`9999px`).
- In-text word feedback badges use compact rounded corners (`8px`).

## Components
- **Microphone button (`data-ui="mic"`)**: Prominent circular control (64×64px). Idle: teal background with a white microphone icon. Listening: amber orange background accompanied by soft pulsing aura rings. Disabled: muted grey with low opacity.
- **Audio buttons (`speak`, `speak-slow`)**: Circular pill buttons (48×48px) with subtle tinted backgrounds, easily reachable without cognitive fatigue.
- **Word Feedback**:
  - Word heard correctly (`word-ok`): Green text + light green background tint + a subtle solid underline (or trailing small checkmark icon).
  - Word missed (`word-bad`): Red text + light red background tint + a prominent wavy dashed underline (allowing immediate accessibility for colour-blind learners).
- **Result pill**: Informational pill showing live feedback ("Máy nghe được: ...", "Chính xác ✅", "Chưa nghe rõ 🤔").
- **Bottom sheet**: Pull-up card with 28px rounded top corners, top grab handle, and explicit close button (44×44px).

## Layout additions (Sprout)
- **Navigation**: sticky white top bar (brand 🌱 + name + tagline, links Trang chủ / Từ vựng / Luyện đọc / Phát âm IPA; active link on a 10% green tint). Under 760px the links move to a fixed bottom tab bar (icon + label, 52px tall).
- **Home dashboard** (max-width 1120px, 2:1 grid, stacks on phones): hero card (headline "Học tiếng Anh / dễ hơn mỗi ngày", three ✓ benefits, primary CTA, illustration slot) · "Hôm nay học gì?" list card with the mascot and speech bubble · "Từ vựng hôm nay" pastel word cards (horizontal scroll on phones) · quick pronunciation card with a decorative waveform that animates while listening.
- **Illustrations**: `assets/illustrations/hero.png` and `mascot.png` (transparent PNG); prompts in `design/ILLUSTRATIONS.md`.

## Do's and Don'ts
- **Do** provide non-colour cues alongside colour highlights for all spoken feedback.
- **Do** ensure all interactive touch targets meet or exceed 44×44px (mic is 64px).
- **Do** display IPA symbols with the dedicated phonetic font stack.
- **Don't** design login, accounts, user profiles, or cloud sync pages.
- **Don't** design leaderboards, streaks, ads, or paywalls.
- **Don't** show simulated phoneme-level percentage scores (e.g. "your /θ/ was 62%"). The browser engine only reports recognized whole words.
- **Don't** use photos of real people. Flat, friendly illustrations (hero character, chick mascot) and emoji are fine; every illustration needs an emoji fallback so the page never breaks without it.
- **Don't** render typography smaller than 12px.

## Topic Theming
Every topic is governed by an accent color variable (`--topic-accent`). Dependent shades are derived predictably:
1. **Light card tint (`--topic-tint`)**: Calculated via `color-mix(in srgb, var(--topic-accent) 12%, #FFFFFF)` for topic cards and flashcard backplates.
2. **Ink colour (`--topic-ink`)**: `color-mix(in srgb, var(--topic-accent) 55%, #000000)`. Verified for all 8 topics: worst case 5.66:1 on the 12% tint and 5.12:1 on a 25% tint (PASS AA). (80% was tried first and failed for appearance, celebration, housing and sea_animals.)
3. **Accent border**: `color-mix(in srgb, var(--topic-accent) 25%, transparent)`.

## Motion
- **Card Flip**: 3D transform transition (`transform: rotateY(180deg)`) over `0.45s` with `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Mic Pulse**: Radial breathing keyframe expansion scaling from `1.0` to `1.18` with opacity fading from `0.4` to `0` over `1.6s` infinite.
- **Reduced Motion**: Fallback cleanly to instantaneous opacity fades (`transition: opacity 0.2s linear`) when `@media (prefers-reduced-motion: reduce)` is detected.