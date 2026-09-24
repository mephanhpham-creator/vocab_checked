# SCREENS.md: screens, states and UI contract

## How to read this file
- **Screens S1–S7** are everything the app shows. Each one lists its **states**. A design is only complete when every state is drawn.
- **UI contract**: the working code finds elements by their `data-ui` attribute, much like a builder finds the power sockets on a floor plan. The design may place and style these elements however it likes, but each listed `data-ui` element must exist with the listed role. Elements marked *(dynamic)* are filled by code, so the design only shows sample content in them.
- Sample content is real app data. Use it instead of lorem ipsum.

---

## S1: Home (3 tabs)
The top of the page has the app title "🎓 IELTS Vocab & Speaking", then 3 tabs, a one-line hint under the tabs, then the tab's content.

| data-ui | Role |
|---|---|
| `tab` + `data-tab="flashcards" / "read" / "ipa"` | Tab links: "📚 Flashcard", "📖 Luyện đọc", "🔤 Phát âm IPA". The active tab has `aria-selected="true"`. |
| `tab-hint` *(dynamic)* | One-line hint per tab. |
| `topic-grid` | Grid of topic cards (Flashcard and Luyện đọc tabs). |
| `topic-card` + `data-topic="{key}"` | One card per topic, tinted with that topic's accent. Contains the elements below. |
| `topic-icon`, `topic-title`, `topic-subtitle` *(dynamic)* | e.g. 🪞 / "Ngoại hình" / "Appearance" |
| `topic-count` *(dynamic)* | Flashcard tab: "52 từ". Read tab: "8 câu". |
| `topic-progress-label` + `topic-progress-bar` *(dynamic)* | Flashcard tab: "12/52" known. Read tab: best average "64%". |
| `storage-note` | "💾 Tiến độ được lưu tự động trên trình duyệt này…" |

States: Flashcard tab with mixed progress (0%, 40%, 100% cards) · Read tab · IPA tab (shows S4) · first visit (all 0%).

## S2: Flashcard deck (one topic)
| data-ui | Role |
|---|---|
| `back` | "← Danh sách chủ đề" |
| `topic-name` *(dynamic)* | "Ngoại hình" |
| `filter-all` / `filter-unknown` | Chips "📚 Tất cả (52)" / "🧠 Chỉ từ chưa thuộc (40)"; one of them is active. |
| `reset` | "↺ Reset tiến độ" |
| `stat-total`, `stat-known`, `stat-unknown` *(dynamic)* | 3 small stat tiles. |
| `progress-bar` *(dynamic)* | Known / total. |
| `card` | Flippable card (tap = flip). Front and back below. |
| Front: `pos`, `status`, `emoji`, `word`, `ipa` *(dynamic)* | "NOUN" · ✅/😕/none · 🧴 · "complexion" · "/kəmˈplekʃən/" |
| Front: `speak`, `speak-slow`, `mic` | 🔊 normal, 🐌 very slow, 🎤 say it |
| Front: `check-result` *(dynamic)* | See the mic states below. |
| Back: `word`, `meaning-vi`, `meaning-en`, `example`, `synonyms` *(dynamic)* | "làn da, sắc mặt" · "the natural color and appearance of a person's skin, especially the face" · "She has a fair complexion that burns easily in the sun." · "Đồng nghĩa: skin tone, skin" |
| `mark-unknown` / `mark-known` | "😕 Chưa thuộc" / "✅ Đã thuộc" (toggle; the selected one is filled). |
| `prev`, `flip`, `next` | Navigation. |
| `counter` *(dynamic)* | "Thẻ 3 / 52" |
| `done-banner` | "🎉 Hoàn thành bộ từ này rồi!…" |
| `empty-state` | Shown when the "chưa thuộc" filter has nothing left. |
| `shortcuts` | Keyboard help (Space, ←/→, K, U, L, S, M, F, Esc). Show on desktop; may be hidden or collapsed on mobile. |

States: front · back · marked known · marked unknown · mic listening · result heard-correct · result heard-wrong · heard nothing · filter empty · all known (done banner).

## S3: Read aloud (one topic)
| data-ui | Role |
|---|---|
| `back`, `topic-name` | As in S2. |
| `passage-title` *(dynamic)* | "My New Neighbours" |
| `passage` | The passage text. Contains `sentence` elements. |
| `sentence` + `data-i` *(dynamic)* | One sentence. The current sentence is highlighted and the others are dimmed; tapping one selects it. |
| `word` *(dynamic)* | One word inside a sentence. Modifiers: `vocab` (a learned word: bold plus accent underline; tap opens S7), `ok` (heard: green plus ✓ or another non-colour cue), `bad` (missed: red plus wavy underline or another non-colour cue). |
| `status` *(dynamic)* | "Câu 4 / 8 · Tốt nhất: 86%" |
| `prev`, `speak`, `speak-slow`, `mic`, `next` | Controls. **`mic` is the primary action on this screen.** |
| `heard` *(dynamic)* | "Máy nghe được: “he is almost bold now…” · 86%" |
| `stat-read`, `stat-avg` *(dynamic)* | "Câu đã đọc 5/8", "Điểm tốt nhất TB 72%" |
| `notice` | Browser not supported: "⚠️ Trình duyệt này chưa hỗ trợ nhận dạng giọng nói…" |

Sample: current sentence "He is almost **bald** now, and the little hair he has left has **gone grey**." Heard: "he is almost bold now and the little hair he has left has gone grey" → every word green except "bald" (red), score 92%.

States: before reading · listening (the live transcript appears in `heard`) · after reading with a green/red mix · 100% · heard nothing · browser not supported · mic permission denied (message).

## S4: IPA chart (tab content in S1)
| data-ui | Role |
|---|---|
| `ipa-group` | 3 groups: "Nguyên âm đơn" (12), "Nguyên âm đôi" (8), "Phụ âm" (24). |
| `phoneme-tile` + `data-p` | Big symbol plus key word, e.g. **θ** "think". Tap opens S5. |
| `pair-tile` | Minimal-pair group, e.g. **θ – s** "think / sink". 17 groups. Tap opens S6. |

## S5: Sound detail (bottom sheet)
| data-ui | Role |
|---|---|
| `sheet`, `sheet-close` | Bottom sheet (slides up and covers about 85% of the height) with a ✕ button. |
| `phoneme` *(dynamic)* | "/θ/" large |
| `tip` *(dynamic)* | "Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi, không rung." |
| `practice-row` (repeated) | Word + IPA + `speak` + `mic` + `result`. Two lists: "Ví dụ" (think /θɪŋk/, three /θriː/, bath /bɑːθ/) and "Từ trong kho của bạn" (thin-faced, sympathetic, telepathy…). |

States: default · one row listening · one row correct · one row wrong.

## S6: Minimal pairs (bottom sheet)
| data-ui | Role |
|---|---|
| `contrast`, `note` *(dynamic)* | "/θ/ – /s/" · "/θ/ đặt lưỡi giữa hai răng; /s/ thì không." |
| `quiz-play` | "▶️ Phát một từ" |
| `quiz-choice` ×2, `quiz-replay` | Two big answer buttons ("think" / "sink") and 🔁 |
| `quiz-result` *(dynamic)* | "✅ Chính xác — đó là “think” /θɪŋk/" or "❌ Chưa đúng — …" |
| `pair-block` (repeated) | Two `practice-row`s side by side or stacked: think /θɪŋk/ vs sink /sɪŋk/. |

States: before play · waiting for choice · correct · wrong.

## S7: Word detail (bottom sheet, from S3)
`word` "bald" · `ipa` "/bɔːld/" · `meaning-vi` "hói đầu" · `meaning-en` "having little or no hair on the head" · `example` "He started going bald in his early thirties." · `speak` · `speak-slow`.

## Shared components (design once, reuse everywhere)
| Component | Used in | States |
|---|---|---|
| Speak button 🔊 / slow 🐌 | S2, S3, S5, S6, S7 | idle · playing (pulse) |
| **Mic button 🎤** | S2, S3, S5, S6 | idle · listening (clearly different: colour + pulse) · disabled (not supported) |
| Result pill | S2, S5, S6 | correct ✅ · wrong ❌ "Máy nghe thành: …" · nothing heard 🤔 |
| Chip / tab | S1, S2 | default · active |
| Stat tile | S2, S3 | — |
| Progress bar | S1, S2 | 0% · partial · 100% |
| Bottom sheet | S5, S6, S7 | open |
| Toast | global | "✅ Đã chuyển 120 từ đã đánh dấu từ web cũ sang." |
| Topic theming | S1, S2, S3 | the same components tinted by each topic's accent |
