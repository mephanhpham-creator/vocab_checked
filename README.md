# IELTS Vocab & Speaking

Web học từ vựng IELTS và luyện nói, gồm flashcard, đọc to đoạn văn có chấm theo giọng nói, và luyện phát âm IPA. Chạy như một trang tĩnh, dự kiến host trên GitHub Pages.

> Giao diện theo design system **Sprout** ([`design/DESIGN.md`](design/DESIGN.md)). Mockup trong [`design/mockups/index.html`](design/mockups/index.html) là bản thiết kế trước (Fresh Sorbet), chỉ dùng để xem lại các trạng thái. Giao diện hiện tại xem trực tiếp trên web. Hình minh hoạ: [`design/ILLUSTRATIONS.md`](design/ILLUSTRATIONS.md).

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `data/topics.json` | 8 chủ đề, 273 từ (chuyển từ app flashcard trên Netlify) |
| `data/passages.json` | Mỗi chủ đề 1 đoạn văn. `{chữ hiển thị\|từ trong bộ thẻ}` đánh dấu từ đã học |
| `data/ipa.json` | 44 âm IPA giọng Anh và 17 nhóm cặp âm dễ nhầm |
| `js/match.js` | So khớp lời nói với câu mẫu (thuần logic, có test) |
| `js/speech.js` | Giọng đọc mẫu và nhận dạng giọng nói của trình duyệt, **giọng Anh (en-GB)** |
| `js/store.js` | Tải dữ liệu, lưu tiến độ, nhập tiến độ từ web cũ |
| `js/main.js` | Khung app (menu trên và menu dưới đáy), trang danh sách chủ đề, điều hướng bằng `#/…` |
| `js/home.js` | Trang chủ: banner, “Hôm nay học gì?”, từ vựng hôm nay, luyện phát âm nhanh |
| `js/flashcards.js`, `reading.js`, `ipa.js` | Các màn S2 flashcard, S3 luyện đọc, S4–S7 IPA và bảng trượt |
| `js/ui.js` | Thành phần dùng chung: nút, mic, ô kết quả, bottom sheet, toast. Phần tử được tìm theo thuộc tính `data-ui` |
| `css/app.css` | Design system dùng chung cho app và mockup |
| `design/vocab-ui-art-director/` | Skill cho Gemini Spark để thiết kế lại giao diện ([hướng dẫn](design/README.md)) |

## Chạy và kiểm thử
```bash
npm start   # http://localhost:8000 (cần chạy qua server vì trang dùng ES modules và fetch)
npm test    # node --test
```

## Giới hạn của chức năng kiểm tra phát âm
Chức năng này dùng nhận dạng giọng nói có sẵn trong trình duyệt (Web Speech API):
- Chạy trên Chrome, Edge và Safari. **Không chạy trên Firefox.**
- Cần có mạng và cần cấp quyền dùng micro.
- Chỉ biết **máy có nghe ra đúng từ hay không**, chưa chấm được từng âm.
