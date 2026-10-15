# 10 — Chia việc và thứ tự

Mỗi task giao cho FE/BE/QA owner; chưa gán tên người vì chưa có danh sách dev. Integration Lead giữ contract. Có thể một người nhận nhiều vai trò.

| Task | Công việc | Đầu ra | Phụ thuộc |
|---|---|---|---|
| FE-01 / BE-01 / QA-01 | Foundation UI/API/catalog/DB/harness | 3shell,catalog,health,fixture | Bootstrap |
| FE-02 / BE-02 / QA-02 | Auth/session/CSRF/guards | T02–T07,T56 | M01 |
| FE-03A / BE-03A | Owner profile/list/dashboard/CRUD | Draft→pending,version | M02 |
| FE-03B / BE-03B / QA-03 | Wizard/media/upload/preview | T08–T13 | M03A |
| FE-04 / BE-04 / QA-04 | Admin review/audit/owners | T14–T16,T55 | M03 |
| FE-06 / BE-06 / QA-06 | Cost/public detail | T21–T25,T48 | M03A |
| FE-07 / BE-07 / QA-07 | Map/POI/travel fixture+adapter | T26–T28 | Catalog,searchcontract |
| FE-05 / BE-05 / QA-05 | Search/filter/sort/page/markers | T17–T20 | BE06,BE07 |
| FE-09 / BE-09 / QA-09 | Compare tray/API/table | T37–T39 | M05,M06,M07 |
| FE-10 / BE-10 / QA-10 | Guest viewing/inbox/idempotency | T40–T47 | M02,M03,M06 |
| BE-08A | AI context/schema/rule/rank | OfflineAI deterministic | M05,M06,M07 |
| BE-08B | OpenAI adapter/fallback | Provider smoke riêng | BE08A |
| FE-08 / QA-08 | Chat/chips/proposals/evals | T29–T36,T53 | BE08A |
| INT-01 | Contract generate/check | Schema khớp FE/BE | Các module |
| INT-02 | E2E/build/deploy/runbook | Clean setup+demo | QA,INT01 |

FE/BE trong cùng hàng vẫn là ticket riêng. Chi tiết chức năng và checklist ở module tương ứng; tách nhỏ tiếp khi estimate nhưng giữ mã cha.

## Milestone và gate

1. Foundation/auth: DB/catalog/session/CSRF/ownership pass.
2. Supply: owner draft/upload/submit →admin review qua API thật.
3. Discovery: cost/detail/search/map/compare cùng ID/cost.
4. Conversion: guest lịch →owner xử lý; race/idempotency pass.
5. AI: rule trước/provider sau; DB grounding, clarify/no-match/fallback đúng.
6. Integration: E2E/mobile/deploy; chạy sạch theo README.

FE có thể làm song song bằng mock đúng contract. BE làm CostService và TravelProvider fixture trước SearchService để tránh vòng dependency.
Chưa gán deadline khi chưa biết số dev/năng lực; đội estimate task rồi xếp theo gate.

## PR checklist

- [ ] Ghi task/module và case đã chạy.
- [ ] Contract/DTO/migration/fixture cập nhật cùng nhau.
- [ ] Error/empty/loading/permission được xử lý.
- [ ] Không mở rộng scope ngoài demo làm dependency bắt buộc.
- [ ] Provider live ghi passed hoặc skipped.
- [ ] Thay đổi FE có kiểm desktop/mobile.
- [ ] Reviewer đối chiếu02_DOMAIN_RULES.
