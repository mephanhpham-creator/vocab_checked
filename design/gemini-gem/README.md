# Gem "Vocab Speaking UI Art Director": hướng dẫn dùng

Gem là bản Gemini được cài sẵn vai trò, cách làm việc và tài liệu tham khảo. Nó tương đương một "skill" bên Claude.

Gem này làm 3 việc:
1. Phân tích các ảnh giao diện bạn sưu tầm.
2. Đề xuất 3 hướng thiết kế, bạn chọn một.
3. Xuất file **DESIGN.md** và các **prompt thiết kế màn hình**, sẵn sàng đưa vào Claude Design.

> Gem được dựng theo tinh thần skill `kf-cl-design-init`: **chốt hướng bằng lời trước, chốt con số bằng mắt sau**. Bạn không phải tự nghĩ mã màu hay tên font. Khác biệt là Gem này đã có sẵn bối cảnh sản phẩm, nên không cần phỏng vấn lại từ đầu.

## 1. Tạo Gem (khoảng 5 phút)
1. Vào gemini.google.com → **Gems** → **New Gem**.
2. **Name:** `Vocab Speaking UI Art Director`
3. **Instructions:** dán toàn bộ nội dung file [`INSTRUCTIONS.md`](INSTRUCTIONS.md).
4. **Knowledge → Add files:** tải lên 4 file trong thư mục [`knowledge/`](knowledge/):
   - `PRODUCT.md`: sản phẩm, người dùng, ràng buộc bắt buộc.
   - `SCREENS.md`: 7 màn hình, các trạng thái, "hợp đồng giao diện".
   - `DESIGN-MD-FORMAT.md`: mẫu DESIGN.md chuẩn mà Stitch và Claude Design đều đọc được.
   - `PROMPT-TEMPLATES.md`: mẫu prompt tạo ảnh và prompt thiết kế màn hình.
5. Bấm **Save**.

> Nếu Gemini báo phần Instructions quá dài, giữ nguyên các mục *Role*, *Method* và *Workflow*, chuyển mục *Guardrails* thành một file Knowledge riêng.
>
> Mẹo: nếu tải các file này từ Google Drive thay vì từ máy, Gem sẽ tự dùng bản mới nhất mỗi khi file trên Drive được sửa.

## 2. Quy trình làm việc

| Bước | Bạn làm | Gem trả về |
|---|---|---|
| 1 | Tải 1–6 ảnh giao diện bạn thích, nói rõ thích/không thích gì ở mỗi ảnh | Bảng phân tích "núm vặn" phong cách cho từng ảnh |
| 2 | Trả lời các câu hỏi khi ảnh mâu thuẫn nhau | Điểm chung của các ảnh |
| 3 | Xem 3 hướng thiết kế, có thể yêu cầu ảnh mood | 3 hướng: bảng màu, font, độ bo góc; (tuỳ chọn) prompt ảnh mood |
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
- **Gem Gemini dùng để phân tích và ra định hướng**, cộng với ảnh mood nếu bạn muốn "nhìn thử cảm giác".
- **Màn hình chính thức làm trên Claude Design.**

Lý do: bước C (lắp logic vào giao diện) cần HTML thật. Một tấm ảnh PNG thì mình vẫn phải dựng lại từ đầu, và chữ tiếng Việt/IPA trong ảnh AI rất dễ sai.

**Ví dụ đời thường:** Gemini giống nhà tư vấn nội thất làm moodboard, cho bạn thấy cảm giác căn phòng. Claude Design giống kiến trúc sư vẽ bản vẽ thi công, thứ mà thợ (Claude Code) cầm vào là làm được ngay.

> Claude Design có trong các gói Claude Pro, Max, Team và Enterprise. Nếu dùng Stitch, hãy kiểm tra lại giới hạn của gói miễn phí và tính năng xuất HTML ở thời điểm bạn dùng, vì các công cụ này cập nhật rất nhanh.

## 4. Bàn giao lại cho Claude Code
1. Tải **DESIGN.md** cùng các ảnh tham khảo lên Claude Design để tạo design system.
2. Chạy prompt **bộ component dùng chung** trước, sau đó lần lượt chạy prompt từng màn S1–S7.
3. Đối chiếu từng màn với danh sách trạng thái trong `SCREENS.md`.
4. Xuất **standalone HTML**, hoặc dùng tính năng **handoff to Claude Code**, rồi gửi lại cùng DESIGN.md. Claude Code sẽ gắn logic đã có sẵn (`js/`) vào theo các thuộc tính `data-ui`.
