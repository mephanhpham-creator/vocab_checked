# IELTS Vocab & Speaking

Web học từ vựng IELTS và luyện nói, gồm flashcard, đọc to đoạn văn có chấm theo giọng nói, và luyện phát âm IPA. Chạy như một trang tĩnh, dự kiến host trên GitHub Pages.

> **Trạng thái:** phần logic và dữ liệu đã xong và có test. **Giao diện hiện tại là bản tạm**, đang được thiết kế lại qua quy trình trong [`design/gemini-gem/`](design/gemini-gem/README.md).

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `data/topics.json` | 8 chủ đề, 273 từ (chuyển từ app flashcard trên Netlify) |
| `data/passages.json` | Mỗi chủ đề 1 đoạn văn. `{chữ hiển thị\|từ trong bộ thẻ}` đánh dấu từ đã học |
| `data/ipa.json` | 44 âm IPA giọng Anh và 17 nhóm cặp âm dễ nhầm |
| `js/match.js` | So khớp lời nói với câu mẫu (thuần logic, có test) |
| `js/speech.js` | Giọng đọc mẫu và nhận dạng giọng nói của trình duyệt, **giọng Anh (en-GB)** |
| `js/store.js` | Tải dữ liệu, lưu tiến độ, nhập tiến độ từ web cũ |
| `js/main.js`, `flashcards.js`, `reading.js`, `ipa.js`, `ui.js`, `css/`, `index.html` | Giao diện tạm |
| `design/gemini-gem/` | Gem Gemini để thiết kế lại giao diện |

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
