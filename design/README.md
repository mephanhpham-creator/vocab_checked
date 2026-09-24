# Skill `vocab-ui-art-director` cho Gemini Spark: hướng dẫn dùng

Skill này làm 3 việc:
1. Phân tích các ảnh giao diện bạn sưu tầm.
2. Đề xuất 3 hướng thiết kế (có thể tạo luôn ảnh mood), bạn chọn một.
3. Xuất file **DESIGN.md** và các **prompt thiết kế màn hình**, sẵn sàng đưa vào Claude Design.

> Skill được dựng theo tinh thần `kf-cl-design-init`: **chốt hướng bằng lời trước, chốt con số bằng mắt sau**. Bạn không phải tự nghĩ mã màu hay tên font. Khác biệt là skill này đã có sẵn bối cảnh sản phẩm, nên không cần phỏng vấn lại từ đầu.

## 1. Cài skill vào Gemini Spark (khoảng 2 phút)
1. Lấy file **`vocab-ui-art-director.zip`** (mình đã gửi kèm). Nếu cần tự đóng gói lại, chạy `npm run pack:skill`. Trong file zip:
   ```
   SKILL.md                      ← hướng dẫn chính, nằm ngay gốc zip (Spark yêu cầu)
   references/PRODUCT.md         ← sản phẩm, người dùng, ràng buộc bắt buộc
   references/SCREENS.md         ← 7 màn hình, các trạng thái, "hợp đồng giao diện" data-ui
   references/DESIGN-MD-FORMAT.md← mẫu DESIGN.md chuẩn mà Stitch và Claude Design đều đọc được
   references/PROMPT-TEMPLATES.md← mẫu prompt ảnh mood, prompt màn hình, prompt icon
   ```
2. Vào **gemini.google.com/spark/skills** → **Upload** → chọn file zip.
3. **Kiểm tra skill đã đọc đủ tài liệu:** mở một cuộc trò chuyện mới và gõ
   > *Dùng skill vocab-ui-art-director: liệt kê 4 file references bạn đọc được và 3 ràng buộc "Must" quan trọng nhất trong PRODUCT.md.*

   Nếu skill trả lời đúng 4 file (ví dụ nhắc đến "IPA", "44×44px", "Vietnamese diacritics") thì skill đã sẵn sàng.
   Nếu skill báo không mở được thư mục `references/`, báo lại mình. Mình sẽ gộp tất cả vào một file SKILL.md duy nhất (dài hơn, nhưng chắc chắn đọc được).

> Tên skill phải viết thường và nối bằng gạch ngang. Trong zip chỉ có file `.md`, không có file nhị phân (Spark từ chối các file như `.png`, `.ttf`, `.DS_Store`).

## 2. Quy trình làm việc

| Bước | Bạn làm | Skill trả về |
|---|---|---|
| 1 | Tải 1–6 ảnh giao diện bạn thích, nói rõ thích/không thích gì ở mỗi ảnh | Bảng phân tích "núm vặn" phong cách cho từng ảnh |
| 2 | Trả lời các câu hỏi khi ảnh mâu thuẫn nhau | Điểm chung của các ảnh |
| 3 | Xem 3 hướng thiết kế, có thể yêu cầu ảnh mood | 3 hướng: bảng màu, font, độ bo góc; (tuỳ chọn) ảnh mood tạo ngay trong Spark |
| 4 | Chọn 1 hướng, hoặc trộn các hướng | **DESIGN.md** đã chốt |
| 5 | Nhận prompt | 1 prompt cho bộ component dùng chung và 1 prompt cho mỗi màn hình S1–S7 |
| 6 | Đưa sang Claude Design (xem mục 3) | Checklist bàn giao |

## 3. Tạo ảnh bằng Gemini hay Claude Design? (khuyến nghị)

| | Gemini tạo ảnh | **Claude Design** | Google Stitch (phương án dự phòng) |
|---|---|---|---|
| Đầu ra | Ảnh PNG | **Giao diện thật (HTML)**, sửa được từng phần | Giao diện thật, xuất được HTML/Figma |
| Đọc DESIGN.md | Không (chỉ đọc lời mô tả) | **Có** | Có |
| Chữ tiếng Việt và ký hiệu IPA | Hay bị méo, sai | Chính xác, vì là chữ thật | Chính xác |
| Chuyển sang code | Không được, phải vẽ lại từ đầu | **Xuất HTML độc lập hoặc bàn giao thẳng cho Claude Code** | Xuất HTML |
| Phù hợp với | Ảnh mood, minh hoạ, icon chủ đề | **Thiết kế các màn hình chính thức** | Khi không dùng Claude Design |

**Khuyến nghị:**
- **Skill trên Gemini Spark dùng để phân tích và ra định hướng**, cộng với ảnh mood nếu bạn muốn "nhìn thử cảm giác".
- **Màn hình chính thức làm trên Claude Design.**

Lý do: bước C (lắp logic vào giao diện) cần HTML thật. Một tấm ảnh PNG thì mình vẫn phải dựng lại từ đầu, và chữ tiếng Việt/IPA trong ảnh AI rất dễ sai.

**Ví dụ đời thường:** Gemini giống nhà tư vấn nội thất làm moodboard, cho bạn thấy cảm giác căn phòng. Claude Design giống kiến trúc sư vẽ bản vẽ thi công, thứ mà thợ (Claude Code) cầm vào là làm được ngay.

> Claude Design có trong các gói Claude Pro, Max, Team và Enterprise. Nếu dùng Stitch, hãy kiểm tra lại giới hạn của gói miễn phí và tính năng xuất HTML ở thời điểm bạn dùng, vì các công cụ này cập nhật rất nhanh.

## 4. Bàn giao lại cho Claude Code
1. Tải **DESIGN.md** cùng các ảnh tham khảo lên Claude Design để tạo design system.
2. Chạy prompt **bộ component dùng chung** trước, sau đó lần lượt chạy prompt từng màn S1–S7.
3. Đối chiếu từng màn với danh sách trạng thái trong `SCREENS.md`.
4. Xuất **standalone HTML**, hoặc dùng tính năng **handoff to Claude Code**, rồi gửi lại cùng DESIGN.md. Claude Code sẽ gắn logic đã có sẵn (`js/`) vào theo các thuộc tính `data-ui`.
