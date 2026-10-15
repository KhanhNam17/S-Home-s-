# 09 — Môi trường và triển khai

## 9.1. Thứ tự dựng môi trường

1. Tạo repo theo01, Node24 LTS, npm workspaces và lockfile; pin exact versions sau install/build đầu.
2. PostgreSQL + private upload persistent volume qua Compose; không expose DB ra Internet.
3. BE env theo contracts/ENV_EXAMPLE.txt; FE chỉ biến VITE công khai.
4. Prisma schema/migration tương đương schema.sql; partial unique index giữ raw SQL trong migration.
5. Apply migration DB sạch; seed users/catalog/listings/images.
6. API /health/ready; FE dev proxy /api.
7. Rule AI + fixture travel trước; provider smoke sau.
8. Tests/build rồi reverse proxy HTTPS cùng origin.

## 9.2. Npm scripts đội dev phải cung cấp

Đây là hợp đồng lệnh cần triển khai, không phải lệnh đã có trong gói tài liệu.

| Script | Hành động |
|---|---|
| npm run dev | web+api local |
| npm run db:migrate | migration local |
| npm run db:deploy | apply committed migrations |
| npm run db:seed | seed idempotent, password từ env |
| npm run db:reset:demo | local/test, guard tên DB + APP_ENV |
| npm run lint / typecheck | code checks |
| npm run test:unit | domain/service |
| npm run test:integration | HTTP+DB |
| npm run test:e2e | Playwright API thật |
| npm run test:providers | provider opt-in |
| npm run build | web+api |
| npm run start:api | BE build |
| npm run contracts:generate | types/client từ OpenAPI |
| npm run contracts:check | đối chiếu contract/schema |

## 9.3. Cấu hình

DB URL, secrets, API key chỉ BE. VITE_MAP_STYLE_URL public; token tile nếu có phải public-scoped/restricted-origin, không dùng server secret.
AI_MODE=rule|openai; openai thiếu key/model phải fail config hoặc fallback rõ khi được bật.
TRAVEL_PROVIDER=fixture|osrm; routing lỗi trả unknown, không âm thầm đổi fixture.
Cookie secure HTTPS; trust proxy chỉ reverse proxy được cấu hình.

## 9.4. CI và deploy

CI: install lockfile →lint/typecheck →unit →integration DB sạch →contracts check →build →E2E.
Deploy: backup DB/upload →db:deploy →start API →ready →publish FE cùng version →smoke3role.
Migration lỗi thì dừng, không reset. Rollback app chỉ khi schema tương thích; ưu tiên additive migrations.
Demo một instance API. Trước scale>1 phải thay in-memory rate limit và conversation mutex bằng shared coordination.

## 9.5. Seed và dữ liệu

Admin/OwnerA/OwnerB passwords từ env, không nhúng FE. API thật không có toolbar impersonation; dùng login/logout.
Phone giả không gọi/SMS. Ảnh phải có file thật được phép dùng; seed kiểm tồn tại, không silently bỏ ảnh khiến approved listing thiếu ảnh.
Seed idempotent và transaction: approved chỉ được thấy sau khi ảnh attach đủ. Fixture ngày lịch dùng now+offset.
Không chạy reset với dữ liệu người dùng thật.

## 9.6. Quan sát/phục hồi

Log requestId/status/latency/provider mode/errorCode; redact PII/credentials/chat.
Backup nightly cho demo có dữ liệu và trước migration; DB+upload cùng version; thử restore vào môi trường khác.
Provider outage vẫn search/manual filter; map outage vẫn list; API/DB outage hiện lỗi, không fake success.
Session hết hạn không mất listing đã lưu; form chưa lưu cần cảnh báo rời trang.

## 9.7. Bàn giao

README setup, link demo, commit/tag, migration version, test report, modes bật, credential truyền riêng và known limitations. Provider chưa chạy phải ghi skipped.
