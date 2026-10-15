# 00 — Phạm vi và quyết định

## 0.1. Kết quả phải trình diễn được

Guest không đăng nhập → tìm bằng bộ lọc hoặc AI → xem bản đồ → đọc chi phí → so sánh → gửi yêu cầu xem.
Chủ trọ → đăng nhập → đăng tin → admin duyệt → tin công khai → chủ tiếp nhận lịch → cập nhật đã thuê.
Dữ liệu phải lưu DB, còn sau khi reload/restart; các quyền được kiểm tra tại API.

## 0.2. Ba vai trò

| Hành động | Guest | Owner | Admin |
|---|---|---|---|
| Đọc nội dung công khai, AI, map, so sánh | Có | Có | Có |
| Gửi yêu cầu xem | Có, phiên ẩn danh | Có qua phần công khai | Có qua phần công khai |
| Tạo/sửa tin | Không | Chỉ tin của mình | Không trong demo |
| Đổi available/rented | Không | Chỉ tin của mình | Không trong demo |
| Đọc danh sách khách đặt lịch | Không | Chỉ phòng của mình | Không trong demo |
| Xác nhận/hủy lịch | Không | Chỉ phòng của mình | Không trong demo |
| Duyệt/từ chối/ẩn/khôi phục tin | Không | Không | Có |
| Đọc hồ sơ chủ trọ phục vụ duyệt | Không | Hồ sơ mình | Có |
| Tạo admin | Không | Không | Qua seed/CLI vận hành, không có public API |

Guest là người không có user account; hệ thống vẫn có cookie phiên ẩn danh để CSRF, AI và hạn chế lạm dụng. Không hiện yêu cầu đăng nhập khi guest thực hiện các chức năng công khai.

## 0.3. Module giữ nguyên mã mockup

M01 nền tảng UI/catalog; M02 auth; M03 chủ trọ/tin/ảnh; M04 admin; M05 tìm kiếm; M06 chi tiết/chi phí; M07 map; M08 AI; M09 so sánh; M10 yêu cầu xem.

Tất cả là phạm vi demo bắt buộc. Email/SMS tự động, tài khoản người thuê, thanh toán, cọc online, hợp đồng điện tử, review, tour 360, quảng cáo và vận hành nhiều tòa nhà để giai đoạn sau.

## 0.4. Quyết định kỹ thuật v1

| Mục | Chốt để triển khai |
|---|---|
| FE | React + TypeScript + Vite; React Router; TanStack Query; React Hook Form và Zod |
| BE | NestJS + TypeScript; REST JSON, base /api/v1; DTO validation |
| DB | PostgreSQL, Prisma; migration được commit |
| Runtime | Node.js 24 LTS; khóa patch/package tương thích trong lockfile khi khởi tạo |
| Auth | Opaque session cookie; password Argon2id; CSRF token; không lưu token auth trong localStorage |
| Ảnh | Local private volume cho demo; StorageAdapter để thay bằng object storage sau |
| Map | MapLibre GL JS, style/tile URL cấu hình theo nhà cung cấp |
| Địa điểm | Catalog POI đã seed + chọn pin; chưa triển khai geocoding địa chỉ tự do |
| Travel | fixture cho baseline có nhãn minh họa; OSRM adapter là lựa chọn tích hợp thật |
| AI | OpenAI Responses structured output để trích xuất nhu cầu; DB search và giải thích do code kiểm soát; fallback deterministic rõ chế độ |
| Deployment | Một API instance + PostgreSQL + persistent upload volume + reverse proxy HTTPS cùng origin |
| Code layout | Monorepo npm workspaces: apps/web, apps/api, packages/contracts, packages/domain |
| Kiểm thử | Unit domain/service; integration DB/HTTP; Playwright E2E |

Đây là lựa chọn đề xuất để nhóm có một chuẩn thống nhất, không phải stack có sẵn đã được xác nhận. Nếu đội dùng framework khác, giữ nguyên contract, rule và test.

## 0.5. Ba mức chạy

- LOCAL/CI: DB thật, AI deterministic, travel fixture; không cần khóa LLM.
- DEMO tích hợp: DB/auth/upload thật; AI OpenAI khi có key/model phù hợp, fallback phải có nhãn; map có nền thật, travel có thể fixture có nhãn.
- Sau demo: routing thực tế, geocoding và các tính năng mở rộng.

Không gọi “AI tích hợp thật đã hoàn thành” khi mới chạy rule fallback. Nghiệm thu M08 có hai dòng độc lập: deterministic passed và provider passed/skipped với lý do.

## 0.6. Giới hạn quy mô

Một tin = một phòng; tối đa 10 ảnh/tin, mỗi ảnh đầu vào ≤5 MiB; tối đa 3 phòng so sánh; 20 tin/trang mặc định, tối đa 50; map tối đa 200 marker/lần. Search demo giới hạn tối đa 500 candidate trước tính travel/ranking, xem M05 để xử lý vượt giới hạn.

Không có giữ chỗ/đặt cọc. Lịch xem không khóa phòng và không đảm bảo người đó thuê được phòng.

## 0.7. Definition of Done

Một module hoàn thành khi FE hiển thị đủ trạng thái, BE thực thi quyền/rule, API đúng contract, dữ liệu persist, test quan trọng pass, không có secret trong bundle/log, và luồng liên quan chạy qua API thật. Đánh dấu mock/fallback riêng.
