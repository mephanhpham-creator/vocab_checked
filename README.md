# IELTS Vocab & Speaking

Web học từ vựng tiếng Anh theo trình độ (A1 → C2, cộng 8 chủ đề IELTS) và luyện nói, gồm flashcard, đọc to đoạn văn có chấm theo giọng nói, và luyện phát âm IPA. Chạy như một trang tĩnh trên GitHub Pages.

> Giao diện theo design system **Sprout** ([`design/DESIGN.md`](design/DESIGN.md)). Hình minh hoạ: [`design/ILLUSTRATIONS.md`](design/ILLUSTRATIONS.md).

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `data/topics.json` | Nhóm **IELTS**: 8 chủ đề, 273 từ (chuyển từ app flashcard trên Netlify). Từ nào có trong danh sách Cambridge/Oxford thì có thêm trường `level` |
| `data/passages.json` | Mỗi chủ đề IELTS 1 đoạn văn. `{chữ hiển thị\|từ trong bộ thẻ}` đánh dấu từ đã học |
| `data/levels/<level>.json` | Một file cho mỗi trình độ (`{topics, passages}`), **được sinh ra**, đừng sửa tay. Hiện có `a1.json` (640 từ từ danh sách Cambridge Starters + Movers, 39 bộ, 39 đoạn đọc), `a2.json` (903 từ, 72 bộ, 72 đoạn đọc) `b1.json` (1.420 từ mới so với A2, 76 bộ, 76 đoạn đọc) `b2.json` (550 từ Oxford 5000 B2 chưa có ở A1–B1, 28 bộ, 28 đoạn đọc) và `c1.json` (1.231 từ Oxford 5000 C1 chưa có ở A1–B2, 61 bộ, 61 đoạn đọc). Các bộ chia theo nghĩa, mỗi trình độ xếp dưới 10–24 chủ đề lớn |
| `data/src/<level>/` | Nguồn để sửa: `cards.tsv` (mỗi dòng một thẻ), `groups.json` (các bộ thẻ, thứ tự, màu, chủ đề lớn `section`), `passages.json` |
| `tools/build_level.py` | Sinh `data/levels/<level>.json` từ `data/src/<level>/`, kiểm tra dữ liệu và tự điền IPA giọng Anh |
| `data/ipa.json` | 44 âm IPA giọng Anh và 17 nhóm cặp âm dễ nhầm |
| `js/match.js` | So khớp lời nói với câu mẫu (thuần logic, có test) |
| `js/speech.js` | Giọng đọc mẫu và nhận dạng giọng nói của trình duyệt, **giọng Anh (en-GB)** |
| `js/store.js` | Danh sách trình độ (`LEVELS`), tải dữ liệu từng trình độ khi cần, lưu tiến độ và trình độ đã chọn, nhập tiến độ từ web cũ |
| `js/main.js` | Khung app (menu trên và menu dưới đáy), trang danh sách chủ đề, điều hướng bằng `#/…` |
| `js/home.js` | Trang chủ: banner, “Hôm nay học gì?”, từ vựng hôm nay, luyện phát âm nhanh |
| `js/flashcards.js`, `reading.js`, `ipa.js` | Các màn S2 flashcard, S3 luyện đọc, S4–S7 IPA và bảng trượt |
| `js/ui.js` | Thành phần dùng chung: nút, mic, ô kết quả, bottom sheet, toast. Phần tử được tìm theo thuộc tính `data-ui` |
| `css/app.css` | Design system Sprout (token, component, các màn) |
| `design/vocab-ui-art-director/` | Skill cho Gemini Spark để thiết kế lại giao diện ([hướng dẫn](design/README.md)) |

## Chạy và kiểm thử
```bash
npm start   # http://localhost:8000 (cần chạy qua server vì trang dùng ES modules và fetch)
npm test    # node --test
```

## Thêm hoặc sửa từ của một trình độ
1. Sửa `data/src/<level>/cards.tsv` (mở bằng Excel hoặc Google Sheets, lưu lại dạng TSV). Để trống cột `ipa` nếu muốn máy tự điền.
2. Tự điền IPA từ [Britfone](https://github.com/JoseLlarena/Britfone) (từ điển phát âm Anh–Anh, giấy phép MIT):
   ```bash
   curl -sO https://raw.githubusercontent.com/JoseLlarena/Britfone/master/britfone.main.3.0.1.csv
   python3 tools/build_level.py a2 --fill-ipa britfone.main.3.0.1.csv
   ```
   Máy đổi sang cách ghi của Cambridge (trọng âm đặt đầu âm tiết, bỏ trọng âm ở từ một âm tiết). Từ nào Britfone không có sẽ được liệt kê để điền tay. Từ có hai cách đọc (*record*, *present*…) thì kiểm tra lại cho đúng từ loại.
3. Build và kiểm tra: `python3 tools/build_level.py a2`. Lệnh báo lỗi nếu thiếu trường, trùng từ trong một chủ đề, hoặc đoạn đọc đánh dấu một từ không có trong bộ thẻ.
4. Mở trình độ mới trên web: đặt `ready: true` cho trình độ đó trong `LEVELS` (`js/store.js`).

Mỗi nhóm trong `groups.json` là một bộ thẻ, chia theo nghĩa (ví dụ *Trái cây & rau củ*, *Đồ uống*) chứ không chia theo số lượng từ. Tiến độ được lưu theo *mã bộ + từ*. Nếu sau này một từ chuyển sang bộ khác, `js/store.js` tự chuyển dấu "đã thuộc" theo từ đó.

## Giới hạn của chức năng kiểm tra phát âm
Chức năng này dùng nhận dạng giọng nói có sẵn trong trình duyệt (Web Speech API):
- Chạy trên Chrome, Edge và Safari. **Không chạy trên Firefox.**
- Cần có mạng và cần cấp quyền dùng micro.
- Chỉ biết **máy có nghe ra đúng từ hay không**, chưa chấm được từng âm.
