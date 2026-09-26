# Hình minh hoạ: prompt để tạo bằng Gemini

Trang chủ có sẵn hai chỗ để đặt hình:

| File | Vị trí | Hiện đang hiển thị |
|---|---|---|
| `assets/illustrations/hero.png` | Banner chào mừng, bên phải tiêu đề | 👩‍🎓 |
| `assets/illustrations/mascot.png` | Góc khối "Hôm nay học gì?", cạnh bong bóng lời thoại | 🐥 |

Khi chưa có hình, web tự hiển thị emoji ở cột bên phải, nên trang không bao giờ bị vỡ. Bạn gửi file PNG cho mình, mình sẽ đặt vào đúng thư mục.

## Cách làm
1. Mở Gemini và dán **từng prompt** bên dưới (mỗi hình một cuộc trò chuyện).
2. Tạo vài lần, chọn hình ưng nhất. Nếu cần sửa, nói thêm, ví dụ: "tóc ngắn hơn", "bớt chi tiết".
3. Tải về dạng PNG rồi gửi cho mình.
   - Gemini thường không xuất được nền trong suốt thật, nên prompt yêu cầu **nền trắng tinh**. Mình sẽ tự tách nền trước khi đưa lên web.
4. Tạo hình banner trước. Khi tạo linh vật, gửi kèm hình banner và nói "cùng phong cách với hình này" để hai hình đồng bộ.

## Prompt 1: hình banner (hero.png)
```
A cute chibi-style illustration of a young Vietnamese woman student with a warm smile,
shoulder-length dark brown hair with a small bun, wearing a cream sweater, happily hugging
a large green book to her chest. Soft flat 2D style with gentle shading and clean dark outlines,
like a friendly learning-app illustration. Palette: leaf green (#2E7D32), cream, soft pink cheeks,
warm yellow accents. A few small yellow sparkles and a tiny green leaf sprout floating around her.
Full upper body, centered, facing slightly toward the left.
Plain pure white background (#FFFFFF), no shadow on the ground, no text, no letters, no logo.
Square 1024x1024.
```

## Prompt 2: linh vật (mascot.png)
```
A cute round yellow baby chick mascot with a tiny green leaf sprout growing on top of its head,
big shiny eyes, rosy cheeks, orange beak, one wing raised in a cheerful wave.
Same soft flat 2D style with clean dark outlines as the attached illustration.
Palette: warm yellow, orange beak, leaf green (#2E7D32) sprout.
Full body, centered, facing slightly toward the left (it sits at the bottom-right of a card,
so it should look toward the content).
Plain pure white background (#FFFFFF), no text, no speech bubble, no props.
Square 1024x1024.
```

## Lưu ý
- **Không chép nhân vật có sẵn:** không đưa ảnh mẫu (app EnglishUp) cho Gemini vẽ lại. Hai prompt trên đã có đặc điểm riêng (sách xanh, mầm lá 🌱 của thương hiệu), để hình là của bạn.
- **Không có chữ trong hình:** chữ trong ảnh AI hay bị sai, tiêu đề đã có sẵn bằng chữ thật trên web.
