# 12 — Kiểm tra gói đặc tả

Ngày: 07/10/2026. Đây là kiểm tra tĩnh của tài liệu và dữ liệu mẫu; không phải báo cáo ứng dụng đã chạy.

## Các kiểm tra đã thực hiện

- PASS — Mọi $ref nội bộ trong OpenAPI phân giải được.
- PASS — 41 operationId duy nhất, 38 paths.
- PASS — Required fields tồn tại trong properties; nullable enum có null.
- PASS — AI strict objects có required đầy đủ và additionalProperties=false.
- PASS — Regex điện thoại chấp nhận local/+84 và loại input sai.
- PASS — Fixture UUID hợp lệ và ID không trùng trong từng entity.
- PASS — FK fixture, owner ảnh, dữ liệu publish và lịch tương đối nhất quán.
- PASS — Fixture đúng 9 approved available và 2 approved rented.
- PASS — Fixture đủ pending/draft/rejected/hidden.
- PASS — Ví dụ chi phí 2.560.000/tháng và 4.560.000 ban đầu.
- PASS — Ba fixture Hòa Lạc đáp ứng tổng <3 triệu + vệ sinh riêng.
- PASS — Có 2 yêu cầu xem mỗi owner để kiểm ownership.
- PASS — Tất cả 41 API operation có trong tài liệu đọc.
- PASS — 56 mã test liên tục, duy nhất.
- PASS — 10 module đều có FE và BE riêng.
- PASS — Markdown không có code fence bị bỏ mở.
- PASS — DDL có 15 bảng và 4 enum; tên bảng FK tồn tại.

- PASS — Path parameters khớp placeholder cho cả 41 operations.

## Phần chưa kiểm chứng bằng runtime

- Chưa có mã FE/BE thực thi; 56 ca trong test plan là yêu cầu dev phải chạy, chưa phải 56 ca đã pass.
- OpenAPI đã parse YAML và kiểm tra liên kết/cấu trúc nêu trên; chưa chạy bộ validator OpenAPI đầy đủ hoặc generate client bằng toolchain dự án.
- DDL chưa apply vào PostgreSQL; cần migration/integration test trên DB thật.
- Chưa chạy OpenAI, OSRM, tile provider hoặc kiểm tra credential.
- Mermaid giữ ở dạng nguồn; đội có thể render trong trình đọc hỗ trợ Mermaid.
- Ảnh phòng là tên file seed mong đợi; gói không chứa ảnh và không khẳng định các địa chỉ minh họa là tin thật.
- Mockup thành phẩm chưa được cung cấp; kích thước/chi tiết thị giác cần đối chiếu sau, nghiệp vụ và API đã mô tả trong gói.
