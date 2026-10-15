# 08 — Kiểm thử và nghiệm thu

## 8.1. Các lớp kiểm tra

Unit: cost, transitions, filter, intent merge/rank. Integration: HTTP+PostgreSQL thật, auth/CSRF/ownership/upload/transactions. E2E: browser Guest/OwnerA/OwnerB/Admin riêng context, API thật. Provider smoke chạy opt-in, báo riêng.

## 8.2. Test matrix

| ID | Module | Tình huống | Kết quả |
|---|---|---|---|
| T01 | M01 | Mở Guest | Không login wall, header đúng |
| T02 | M02 | Register role=admin | 400 UNKNOWN_FIELD, không tạo admin |
| T03 | M02 | Sai password | 401 chung |
| T04 | M02 | Login rồi logout | Cookie cũ không dùng được |
| T05 | M02 | Mutation thiếu/sai CSRF | 403 |
| T06 | M02 | Owner gọi review | 403 |
| T07 | M03 | B đọc/sửa tin A | 404, DB không đổi |
| T08 | M03 | Draft {} và title ngắn | {} hợp lệ; title sai range400 |
| T09 | M03 | Submit thiếu ảnh | 422, giữ draft |
| T10 | M03 | Upload oversize/SVG/MIME giả | 413/415, không ready asset |
| T11 | M03 | Attach asset owner khác | 404, không attach |
| T12 | M03 | Reorder ảnh | Ảnh0 là cover, order unique |
| T13 | M03 | Sửa approved | pending, public404, audit đúng |
| T14 | M03/M04 | Admin review version cũ | 409, không duyệt bản mới |
| T15 | M04 | Reject thiếu reason | 422 |
| T16 | M04 | Restore hidden+rented | approved+rented, không discover |
| T17 | M05 | Search fixture mọi status | 9 approved available ban đầu |
| T18 | M05 | Budget total3m | Count/page sau tính phí đúng |
| T19 | M05 | Request trước trả chậm | Chỉ query mới nhất render |
| T20 | M05 | Hơn500 candidates | 422 SEARCH_TOO_BROAD |
| T21 | M06 | Cost fixture chuẩn | 2.560.000 monthly;4.560.000 move-in |
| T22 | M06 | Deposit null | Monthly đủ, move-in null |
| T23 | M06 | E null,k80 | Monthly null;unknownFields đúng |
| T24 | M06 | P null,v0 | Parking0, không làm tổng thiếu |
| T25 | M06 | Occupants vượt capacity | 422 OCCUPANCY_EXCEEDED |
| T26 | M07 | Lat/lng fixture | Không đảo tọa độ |
| T27 | M07 | Travel1201s,limit20min | Không match |
| T28 | M07 | Travel missing/down | Unknown + warning, không0phút |
| T29 | M08 | 3tr chưa nói loại budget | Clarify rent/total |
| T30 | M08 | Bỏ ban công | Remove constraint, không bắt false |
| T31 | M08 | No-match | Proposal chưa tự áp dụng |
| T32 | M08 | Proposal thuộc conversation khác | 404/409, filter không đổi |
| T33 | M08 | Yêu cầu đọc phone lịch | Không có dữ liệu/tool/quyền |
| T34 | M08 | Provider timeout | Fallback có nhãn hoặc503 |
| T35 | M08 | Hai turn cùng version | Một commit, lượt kia409 |
| T36 | M08 | Replay sau room rented | Không gợi ý room đã thuê |
| T37 | M09 | 4 hoặc duplicate IDs | FE chặn,BE400 |
| T38 | M09 | Một tin hidden | Row unavailable không lộ title/ảnh |
| T39 | M09 | Compare/detail cùng assumptions | Tổng giống nhau |
| T40 | M10 | Guest submit hợp lệ | 201 requested, không login |
| T41 | M10 | Double submit cùng key/body | Một row, replay200 cùng receipt |
| T42 | M10 | Key giống,body khác | 409 IDEMPOTENCY_CONFLICT |
| T43 | M10 | Hai phiên cùng phone/listing/time | Một row, request kia409 |
| T44 | M10 | Race mark rented trước booking | Row lock chặn booking sau rented commit |
| T45 | M10 | Confirm past/rented | 409 INVALID_STATE/LISTING_UNAVAILABLE |
| T46 | M10 | B đọc lịch A | 404 hoặc không xuất hiện trong list |
| T47 | M10 | Confirm lịch | Room không tự chuyển rented |
| T48 | Cross | Guest đọc media draft | 404 |
| T49 | Cross | Logout đổi owner | Private cache cũ bị xóa |
| T50 | Cross | Reload/restart API | DB/ảnh/lịch persist |
| T51 | Cross | Mobile390px | Form/map/chat/compare dùng được |
| T52 | Cross | Kiểm bundle/log | Không key/password/PII |
| T53 | M08 | Live LLM smoke | Schema hợp lệ, DB filter đúng |
| T54 | M07 | Live OSRM smoke nếu bật | Seconds/meters/source đúng |
| T55 | M04 | Approve thiếu publish data | 422, không công khai |
| T56 | M02 | CSRF lấy tab2 | Token tab1 cùng session vẫn dùng được |
## 8.3. E2E buổi demo

1. Guest lọc Hòa Lạc, total≤3m, vệ sinh riêng; map/card đồng nhất.
2. AI hỏi mơ hồ ngân sách → làm rõ → gợi ý.
3. Mở room chuẩn, thay assumptions, so sánh2tin.
4. Guest gửi lịch, OwnerA login thấy và xác nhận.
5. OwnerA tạo draft/upload/submit; Guest chưa thấy.
6. Admin duyệt; Guest refresh thấy search/map/AI.
7. Owner sửa title; Admin từ chối; Owner sửa/gửi lại; Admin approve.
8. Owner mark rented; search/map/AI loại; URL cũ báo đã thuê.
9. OwnerB không truy cập ID/booking A.
10. Reload và lặp lại từ seed reset an toàn.

## 8.4. Hiệu năng mục tiêu

Với fixture16tin và môi trường dev thống nhất: search p95<1s không routing miss; private mutation p95<1s không upload; AI hoàn thành/fallback trong15s. Đây là mục tiêu cần đo, chưa phải kết quả đã đạt.
Load thử500tin synthetic và20 concurrent users, ghi p95/error/CPU/RAM/N+1. Không suy rộng thành capacity production.

## 8.5. Release gate

- [ ] Unit/integration/E2E pass.
- [ ] Migration + backup/restore được thử.
- [ ] Secret không commit, cookie HTTPS đúng.
- [ ] Ownership API đúng.
- [ ] Rule/fixture/live được ghi rõ.
- [ ] Không nút giả, không endpoint reset/switch-role public.
- [ ] Có README chạy từ DB sạch và account lấy env.
