# S:HOMEs — thử UI local

## Cách mở
1. Giải nén toàn bộ ZIP vào thư mục mới trên máy, ví dụ E:\SHOMEs-UI-Linked.
2. VS Code → File → Open Folder → chọn thư mục chứa start.html và assets.
3. Cài Live Server của Ritwick Dey nếu chưa có.
4. Bấm phải start.html → Open with Live Server.
5. Bấm từng thẻ màn hình hoặc dùng thanh điều hướng ở dưới mọi trang.

Không cần Node.js, npm, database, backend hoặc API key. Cần Internet để tải font, Tailwind và ảnh từ nguồn của mockup.

## Đã nối
- Trang chủ, so sánh, đăng nhập/đăng ký và các màn hình Owner/Admin/System được xuất trong ZIP.
- Menu chính, mục lục Stitch, liên kết sửa tin/xem trước/lịch xem/kiểm duyệt.
- Đăng nhập minh họa đưa sang khu vực chủ trọ hoặc admin; nút điền tài khoản mẫu vẫn hoạt động.
- Hộp thoại, tab, máy tính phí và các tương tác JavaScript có sẵn được giữ lại.
- Mỗi trang có thanh “Màn hình / Trang chủ / Chủ trọ / Admin” để quay lại.
- Màn hình hoặc tính năng chưa có bản xuất hiển thị thông báo, không điều hướng tới URL lỗi.

## Giới hạn
ZIP đầu vào chứa 14 code.html; bản này có 15 HTML vì bổ sung start.html. Không giả định tất cả 25 màn hình được mô tả đã có file.
Thiếu bản xuất riêng: tìm kiếm, bản đồ, chi tiết phòng công khai, AI, dashboard Owner/Admin, hàng chờ duyệt, đăng nhập Admin riêng.
Wizard tạo tin chỉ có bước biểu phí; wizard sửa chỉ có trạng thái đã xuất. Không bổ sung các bước còn thiếu.
Chỉ là UI prototype: không đăng nhập thật, không lưu vào database, không đồng bộ tin/lịch giữa các trang, không gọi điện/gửi SMS/Zalo thật. Một số bộ lọc và chức năng phụ chỉ hiển thị minh họa.
Chọn Chủ A/B chưa tạo dữ liệu riêng biệt; giao diện có sẵn dùng dữ liệu mẫu cố định.
Các số liệu, huy hiệu xác minh và cam kết trong mockup gốc là nội dung minh họa, chưa được kiểm chứng.

## Nếu gặp lỗi
- Trang không có màu/font/ảnh: kiểm tra mạng; nguồn ảnh/font bên ngoài có thể không truy cập được.
- Không thấy Go Live: kiểm tra đã mở cả folder và cài Live Server.
- Không chuyển trang: giải nén đầy đủ, giữ assets cùng cấp với HTML; dùng bản mới, không trộn với bản gốc.
- Thử điện thoại: F12 → Ctrl+Shift+M → chọn chiều rộng 390px hoặc 320px.

## Kiểm tra bản đóng gói
Đã kiểm tra cú pháp JavaScript, các đường dẫn file nội bộ và 274 điều kiện điều hướng trong mô phỏng DOM. Chưa kiểm tra hiển thị/tương tác bằng trình duyệt thật trong môi trường tạo bản này.
