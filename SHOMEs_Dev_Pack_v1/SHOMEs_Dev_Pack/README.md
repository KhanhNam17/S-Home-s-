# S:HOMEs — Demo Development Pack v1.0

Ngày: 07/10/2026. Tài liệu triển khai đề xuất, bám phạm vi SHOMEs_Demo_Mockup_Prompt.md. Chưa có mockup thành phẩm được cung cấp; route, trạng thái và nghiệp vụ dưới đây là chuẩn triển khai, còn kích thước/component giao diện đối chiếu mockup khi có.

## Bắt đầu từ đâu

1. Cả nhóm đọc 00_SCOPE_DECISIONS.md và 02_DOMAIN_RULES.md.
2. FE đọc 05_FRONTEND_GUIDE.md, BE đọc 06_BACKEND_GUIDE.md.
3. Cả hai dùng 04_API_CONTRACT.md và contracts/openapi.yaml làm hợp đồng.
4. Mỗi người nhận module trong modules/, cùng task ở 10_TASK_BOARD.md.
5. QA dùng 08_TEST_PLAN.md; người tích hợp dùng 09_DELIVERY_RUNBOOK.md.
6. Thực hiện theo dependency; hoàn thành đến đâu đánh dấu checklist đến đó.

| Tệp | Nội dung |
|---|---|
| 00_SCOPE_DECISIONS.md | Phạm vi, quyền, quyết định và mức hoàn thành |
| 01_ARCHITECTURE.md | Kiến trúc, thư mục, luồng hệ thống |
| 02_DOMAIN_RULES.md | Trạng thái, validation, chi phí, quyền, nhất quán |
| 03_DATABASE.md | Bảng, quan hệ, ràng buộc, transaction, seed |
| 04_API_CONTRACT.md | HTTP, DTO, ví dụ request/response, lỗi |
| 05_FRONTEND_GUIDE.md | Route, state, query, form, UI, cache |
| 06_BACKEND_GUIDE.md | Module/service, auth, transaction, upload |
| 07_AI_MAP_INTEGRATION.md | AI thật/fallback, tìm phòng, map, travel |
| 08_TEST_PLAN.md | Unit/integration/E2E và nghiệm thu |
| 09_DELIVERY_RUNBOOK.md | Môi trường, chạy, triển khai, dữ liệu, demo |
| 10_TASK_BOARD.md | Task FE/BE/QA, dependency, đầu ra |
| 11_SOURCES_AND_DECISIONS.md | Tài liệu kỹ thuật tham chiếu và quyết định thiết kế |
| 12_DOCUMENT_VALIDATION.md | Kết quả rà soát gói đặc tả và giới hạn kiểm chứng |
| modules/M01…M10 | Đặc tả riêng từng module, FE/BE tách rõ |
| contracts/openapi.yaml | Hợp đồng API OpenAPI 3.0.3 |
| contracts/schema.sql | DDL tham chiếu PostgreSQL; dùng để tạo migration tương đương |
| contracts/ai-intent.schema.json | Schema đầu ra trích xuất nhu cầu AI |
| contracts/fixtures.json | Dữ liệu kiểm thử minh họa có ID ổn định |
| contracts/ENV_EXAMPLE.txt | Các biến môi trường cần khai báo |

Bản Markdown tổng hợp ngoài ZIP ghép nội dung các tài liệu để đọc liên tục. Trong ZIP, tệp từng phần là bản thuận tiện để chia việc.

## Quy tắc phối hợp

- Không sửa tên field/enum/API riêng ở FE hoặc BE. Sửa contract trước, cập nhật ví dụ và test cùng PR.
- Backend là nguồn quyết định quyền, trạng thái và dữ liệu công khai.
- Mock adapter FE chỉ dùng để phát triển/test. Bản demo tích hợp sử dụng API và DB thật.
- Thông số giới hạn/retention/timeout trong tài liệu là quyết định thiết kế v1, không phải số liệu thị trường hay yêu cầu pháp luật.
- Tài liệu/DDL/OpenAPI là đầu vào triển khai, chưa phải ứng dụng đã được viết hoặc kiểm thử runtime.
