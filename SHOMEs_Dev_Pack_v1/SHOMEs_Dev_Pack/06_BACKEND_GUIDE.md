# 06 — Backend: phần việc và cách triển khai

## 6.1. Nest module boundaries

| Module BE | Controller | Service dùng chung |
|---|---|---|
| AuthModule | auth/* | SessionService, PasswordService, CsrfService |
| CatalogModule | catalog/* | Area/Amenity/PlaceService |
| OwnerModule | owner/profile, owner/dashboard | OwnerProfileService |
| ListingsModule | owner/listings, listings public | ListingService, ListingPolicy, ListingSerializer |
| MediaModule | owner/uploads, media/* | StorageAdapter, ImageProcessor |
| ModerationModule | admin/listings | ModerationService, AuditService |
| SearchModule | GET listings | SearchService, FilterNormalizer |
| CostModule | estimate/compare/search use | CostService từ packages/domain |
| GeoModule | travel/catalog place integration | TravelProvider, TravelCache |
| AiModule | ai/* | IntentExtractor, ConversationService, RankingService |
| ViewingsModule | viewings + owner/viewings | ViewingService, IdempotencyService |
| AdminModule | admin/dashboard, admin/owners | StatsService |

Không serialize Prisma objects trực tiếp. Controller → DTO validation → guard/policy → service → repository/transaction → explicit response mapper.
Global error filter map DB constraint errors sang code nghiệp vụ, không trả stack trace/SQL.

## 6.2. Session auth

1. GET /auth/csrf nếu chưa có phiên tạo token ngẫu nhiên 32 bytes và UUID session. DB lưu SHA256(token), userId=null, expiry24h.
2. Cookie local shomes_sid; HTTPS dùng __Host-shomes_sid, HttpOnly, Secure, SameSite=Lax, Path=/, không Domain.
3. CSRF token = HMAC(CSRF_SECRET, session.id + ':' + token_hash). DB lưu hash của token CSRF. GET csrf có thể tái tạo token ổn định, không đổi token ở mỗi tab.
4. Mutation yêu cầu header X-CSRF-Token, timing-safe hash comparison và Origin đúng APP_ORIGIN. GET không thực thi nghiệp vụ ghi tin/duyệt.
5. Login verify email/password; generic 401 cho sai thông tin. Tạo session mới userId thật, expiry7d, token/CSRF mới; xóa session cũ. Response có User + csrfToken.
6. /auth/me trả user=null cho phiên guest/hết hạn. Protected route yêu cầu user!=null; role lấy từ DB.
7. Logout xóa session, clear cookie, FE clear private cache; guest có thể bootstrap phiên mới.
8. Register role owner do server gán. Admin chỉ seed/CLI. Argon2id dùng thư viện được duy trì; chốt tham số khi benchmark, không tự viết thuật toán hash.
9. Owner/admin account role không cập nhật bằng profile API.

FE cùng origin qua proxy để cấu hình cookie đơn giản. Local FE dev proxy /api sang API; không mở CORS '*'. Nếu tách origin sau này phải cấu hình credential/CORS/CSRF lại.

## 6.3. Validation và response

Nest ValidationPipe bật transform, whitelist, forbidNonWhitelisted; validate enum/range/format; decimal tiền không hợp lệ. DTO classes cụ thể nếu dùng class-validator.
Field optional không đồng nghĩa chấp nhận null; khai báo rõ theo contract. Query boolean parse rõ true/false; không dùng Boolean('false').
Prisma BIGINT chuyển Number chỉ sau safe-integer check. Date→toISOString; Decimal→number với giới hạn đã chốt.
OpenAPI là contract review. CI export API từ DTO hoặc đối chiếu snapshot; các thay đổi breaking phải sửa FE trước merge.

## 6.4. Media pipeline

POST /owner/uploads multipart file → kiểm quyền → stream giới hạn5MiB → nhận diện magic bytes → decode giới hạn8000×8000 → xoay theo EXIF, bỏ metadata, reencode WebP → ghi temp private → atomic rename → insert media_assets ready.
Nếu DB insert lỗi xóa file; nếu process chết file orphan cleanup sau24h. Không tin tên/MIME client; không nhận SVG/HTML/URL ảnh từ user.
Lưu storageKey UUID ngẫu nhiên, không dùng filename client làm đường dẫn. Volume không được web server serve trực tiếp.
GET /media/:id kiểm visibility/ownership/admin, trả stream image/webp với nosniff và Cache-Control:private,no-store. Ảnh private không có URL bucket công khai.
DELETE asset chỉ owner đúng, chưa attach; lock asset kiểm lại FK; attached →409 ASSET_IN_USE. Ảnh đã tải xuống trước lúc ẩn không thể thu hồi; API lần truy cập mới vẫn kiểm quyền.

## 6.5. Transaction và concurrency

Dùng interactive transaction ngắn với row lock (parameterized SQL) khi Prisma operation cần SELECT FOR UPDATE. Tx timeout5s, không gọi LLM/network bên trong.
Lock order: session (nếu booking idempotency) → listing → viewing/asset theo UUID tăng dần. Mọi mutation listing dùng expectedVersion.
Sau lock nếu version khác trả409; update + audit cùng transaction. Unique/foreign-key error mapping rõ, không swallow.
Tạo booking có duplicate phone/listing/time partial unique để hai session vẫn không tạo hai lịch trùng. Collision trả409 DUPLICATE_VIEWING.
Retry DB serialization/deadlock tối đa2 lần khi transaction chưa commit; không retry tùy tiện các tác vụ có hiệu ứng ngoài DB.

## 6.6. Search implementation

Áp dụng SQL public predicate, text/area/bbox/price-rent/area/amenities/capacity trước. Demo tối đa500 candidates; nếu vượt, trả422 SEARCH_TOO_BROAD với hướng dẫn thêm khu vực, không tính total từ tập cắt ngẫu nhiên.
Load fee + travel cần thiết bằng batch; không N+1. Tính total bằng domain function, áp dụng budget-total/travel, sort, total, page, markers sau cùng.
Trong một request dùng một snapshot danh sách (query cùng transaction read ngắn hoặc truy vấn lấy đủ fields); không gọi provider trong read transaction.
Không cache public output xuyên request ở demo. Travel cache riêng không thay public visibility.

## 6.7. AI/Provider boundary

LLM chỉ trích xuất intent có schema. Không có tool thực thi SQL, không đọc lịch/số điện thoại/owner private. Search bằng code sau khi validate output.
API key chỉ server; request timeout10s, tối đa1 retry với lỗi transient trong tổng ngân sách15s; fallback rule nếu bật. Không hardcode model: OPENAI_MODEL bắt buộc khi AI_MODE=openai.
AiConversation chỉ cùng session; get/update khác session404. Một lượt đang chạy trong cùng conversation →409 TURN_IN_PROGRESS (single-instance mutex + timeout). Version DB vẫn bắt buộc sau provider.
Lưu user+assistant turn atomically khi thành công. clientTurnId replay trước check expectedVersion; request hash khác→409 TURN_CONFLICT. Provider thất bại hoàn toàn không advance context.

## 6.8. Hạn chế lạm dụng và logging

Giới hạn đề xuất cho demo một instance:
- login: 10 attempts/15min theo IP+email; cap60/15min/IP.
- registration: 5/hour/IP.
- viewing: 3/min/session, 10/hour/IP.
- AI: 10/min/session, 30/min/IP; thêm AI_DAILY_REQUEST_LIMIT ở toàn instance.
- uploads: 20/hour/user; toàn bộ request JSON tối đa64KiB, riêng multipart giới hạn theo file.
429 có Retry-After. IP proxy chỉ tin reverse proxy cấu hình; không tin X-Forwarded-For bất kỳ.

Request log: requestId, route, actorId nếu có, status, duration, providerMode/errorCode; redact password/cookie/phone/note/prompt. Audit nghiệp vụ riêng.
Đây là mức cấu hình demo, không phải capacity guarantee; đo để điều chỉnh.

## 6.9. Health và vận hành

/live không gọi dependencies. /ready kiểm DB và thư mục upload writable; provider AI/routing không làm readiness đỏ nếu fallback hoạt động, status chi tiết chỉ log nội bộ.
Graceful shutdown ngừng nhận request, đợi transaction hiện tại, đóng Prisma. Backup DB và upload volume cùng nhịp.
Không có endpoint public reset DB hay switch role; seed/reset chạy CLI với guard APP_ENV!=production và xác nhận tên DB.
