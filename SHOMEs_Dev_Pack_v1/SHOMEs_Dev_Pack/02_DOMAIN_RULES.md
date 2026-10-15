# 02 — Quy tắc nghiệp vụ chuẩn

## 2.1. Từ vựng

Listing: tin tương ứng một phòng. Owner: tài khoản vai trò owner có OwnerProfile.
ModerationStatus: draft|pending|approved|rejected|hidden.
Availability: available|rented.
ViewingStatus: requested|confirmed|cancelled.
Guest không có bản ghi user; session có userId=null.
API dùng camelCase; DB snake_case. ID UUID; timestamp ISO 8601 UTC; UI Asia/Ho_Chi_Minh.

## 2.2. Predicate dùng chung

- canReadPublicDetail = moderationStatus == approved.
- canDiscover = canReadPublicDetail && availability == available.
- canCreateViewing = canDiscover && requestedAt > now && owner contact hợp lệ.
- canConfirmViewing = canDiscover && viewing.status == requested && requestedAt > now.
- canReadPrivateListing = actor.admin OR actor.owner && listing.ownerId == actor.id.
- canManageListing = actor.owner && ownerId == actor.id.
- canReadViewing = actor.owner && viewing.listing.ownerId == actor.id.
- canReadMedia = attached listing approved OR asset.ownerId==actor.id OR actor.admin.

Public projection không chứa owner email, password, session, moderation note, guest phone, lịch hoặc storageKey. Mọi private object lookup sai chủ trả 404; sai role tại cả route trả 403; chưa đăng nhập với route cần user trả 401.

## 2.3. Bảng chuyển trạng thái tin

| Action | Actor | Từ | Đến | Điều kiện |
|---|---|---|---|---|
| create | owner | mới | draft + available | ownerId lấy từ session |
| patch content | owner đúng tin | draft | draft | validate field được gửi |
| patch content | owner đúng tin | rejected/hidden | giữ nguyên | reason vẫn hiển thị đến khi submit |
| patch content | owner đúng tin | pending | pending | bản sau sửa phải đủ publish validation |
| patch content | owner đúng tin | approved | pending | đủ publish validation; cảnh báo trước khi lưu |
| submit | owner đúng tin | draft/rejected/hidden | pending | đủ trường/ảnh; clear current rejection reason |
| review approve | admin | pending | approved | expectedVersion khớp, publish validation lại |
| review reject | admin | pending | rejected | reason 5–1000 ký tự |
| hide | admin | approved | hidden | reason 5–1000 ký tự |
| restore | admin | hidden | approved | vẫn đủ publish validation |
| change availability | owner đúng tin | mọi moderation state | không đổi moderation | available/rented; version khớp |

Không có API PATCH chung cho owner để set moderationStatus/ownerId/approvedAt. Chặn extra fields.
Mỗi mutation có expectedVersion; server transaction lock listing và kiểm tra version. Thành công tăng version 1, cập nhật updatedAt. Cùng trạng thái availability vẫn cho chủ xác nhận lại, tăng version và availabilityUpdatedAt; UI gọi “Xác nhận lại trạng thái”.
Patch nội dung thực sự không đổi dữ liệu có thể trả hiện trạng không tăng version; implementation so sánh normalized payload nhất quán.
pending được sửa: cập nhật submittedAt để admin thấy bản mới; audit content_updated. Admin phải dùng version đã xem, không tự tải rồi duyệt bản mới.
AvailabilityUpdatedAt chỉ đổi khi chủ xác nhận trạng thái; không đổi do duyệt tin, sửa giá hay job định kỳ.
ApprovedAt là thời điểm lần duyệt gần nhất; restore ghi audit riêng. Public không dùng approvedAt như chứng cứ xác minh.

## 2.4. Validation chuẩn

| Field API | Nháp | Gửi duyệt | Ràng buộc |
|---|---|---|---|
| title | nullable | bắt buộc | trim; 10–120 ký tự |
| description | nullable | bắt buộc | plain text, 30–5000 ký tự |
| areaCode | nullable | bắt buộc | catalog area đang active |
| address | nullable | bắt buộc | 10–300 ký tự, không HTML |
| latitude/longitude | nullable | bắt buộc cả cặp | -90..90, -180..180; tối đa 6 số thập phân lưu |
| areaM2 | nullable | bắt buộc | >0, ≤1000; tối đa 2 số thập phân |
| maxOccupants | nullable | bắt buộc | integer 1–10 |
| rentVnd | nullable | bắt buộc | integer 1..100.000.000 |
| depositVnd | nullable | cho phép chưa rõ | integer 0..1.000.000.000 |
| electricityVndPerKwh | nullable | cho phép chưa rõ | integer 0..100.000 |
| waterVndPerPerson | nullable | cho phép chưa rõ | integer 0..10.000.000 |
| internetVnd/parkingVndPerVehicle/serviceVnd/otherVnd | nullable | cho phép chưa rõ | integer 0..10.000.000 |
| amenities | object | object | 7 key catalog; value true/false/null; unknown key 400 |
| houseRules | nullable | tùy chọn | plain text, tối đa 2000 |
| imageIds | 0–10 | 1–10 | unique UUID; asset ready, cùng owner, chưa gắn tin khác |
| imageIds[0] | nếu có | bắt buộc | ảnh đại diện |
| expectedVersion | với mutation tin | bắt buộc | integer ≥1 |

amenity codes: private_bathroom, kitchen, parking, air_conditioner, balcony, pets_allowed, flexible_hours.
Không chọn tiện nghi chưa chắc có; null = chưa rõ, false = không có. Bộ lọc “có” chỉ chấp nhận true.
PATCH: omitted = giữ; null = xóa/đặt chưa rõ với field nullable; array/object được gửi là thay toàn bộ phần đó sau normalize.
Không lưu confirmPassword. Name 2–100; email normalize trim/lower ≤254; mật khẩu 10–128 ký tự; phone chuẩn hóa +84, chấp nhận đầu vào mobile VN 0[3|5|7|8|9] + 8 chữ số hoặc +84 tương đương. Đây là phạm vi form demo; không tự nhận định chủ sở hữu số điện thoại đã xác thực.
OwnerProfile.publicPhone phải hợp lệ trước submit; người dùng đã đồng ý công khai số này trong form.

## 2.5. Tính phí duy nhất

CostAssumptions = {occupants:1..10, vehicles:0..10, electricityKwh:0..2000}; tất cả integer.
Default = {occupants:1, vehicles:1, electricityKwh:80}. Hiển thị rõ giả định.
R + E*k + W*n + I + P*v + S + F = estimatedMonthlyVnd.
estimatedMoveInVnd = estimatedMonthlyVnd + D.

- Mỗi khoản đầu vào integer VNĐ; DB BIGINT, DTO giới hạn để số và tổng nằm trong Number safe range.
- E=null và k=0 → khoản điện bằng 0; P=null và v=0 → gửi xe bằng 0. Với hệ số >0 mà đơn giá null, khoản đó unknown.
- Thiếu bất kỳ khoản bắt buộc vào tổng → estimatedMonthlyVnd=null, monthlyComplete=false; vẫn trả knownSubtotalVnd và unknownFields.
- D=null không làm monthlyComplete=false, nhưng estimatedMoveInVnd=null, moveInComplete=false.
- Nếu occupants > maxOccupants: estimate detail trả 422 OCCUPANCY_EXCEEDED. Search tự loại; compare trả row incompatible_assumptions.
- Không chia giá thuê cho số người nếu chưa thể hiện nhãn “mỗi người”. V1 các tổng chính đều theo phòng.
- Estimate service dùng chung FE preview và BE; response BE là kết quả chuẩn khi lưu/lọc.
- Giá/phí change khiến public query/compare/AI data cần refetch.

Test chuẩn: R2.000.000 + E3.500×80 + W70.000×1 + I80.000 + P80.000×1 + S50.000 + F0 = 2.560.000; cộng cọc 2.000.000 = 4.560.000.

## 2.6. Tìm kiếm

q trim ≤200; đối sánh không phân biệt hoa thường/dấu qua normalized search_text.
Area filter exact areaCode. Amenities dùng AND. Price min/max bao gồm cận; area min/max bao gồm cận. occupants từ assumptions phải phù hợp maxOccupants.
budgetType=rent dùng rentVnd; total dùng estimatedMonthlyVnd đủ dữ liệu.
Nếu budgetType=total nhưng monthlyComplete=false: loại khi có min/max budget; nếu chỉ sort tổng mà không giới hạn, đặt unknown cuối.
destinationId phải trỏ POI; maxTravelMinutes cần destinationId. mode v1 chỉ driving; không gọi thời gian ô tô là thời gian xe máy.
Travel unknown không đáp ứng hard travel limit. Báo meta.travelIncomplete để phân biệt thiếu dữ liệu với chắc chắn không có phòng.
Sort: newest, rent_asc, total_asc, area_desc, travel_asc. Stable tie: updatedAt DESC rồi id ASC. travel_asc yêu cầu destinationId.
Search/list/map cùng predicate; không filter riêng trên mỗi page rồi tính total sai.

## 2.7. Yêu cầu xem và race

- preferredAt > server now+30 phút và ≤now+30 ngày; đây là quyết định lịch demo.
- Tên 2–100, phone hợp lệ, note ≤1000, consentContact=true bắt buộc.
- Tạo phải có Idempotency-Key UUID; cùng session+route+key+body trả cùng kết quả, khác body trả 409 IDEMPOTENCY_CONFLICT.
- Một phone + listing + preferredAt không có hai lịch requested/confirmed; trả 409 DUPLICATE_VIEWING.
- Xác nhận chỉ requested→confirmed, hủy requested/confirmed→cancelled, cancelled terminal. Lý do hủy 5–1000.
- Confirm yêu cầu còn thời gian tương lai và canDiscover; cancellation cho phép cả khi tin đã ẩn/thuê.
- Lịch đã tạo không tự hủy khi listing đổi trạng thái. Owner UI trả listingBookable=false và cảnh báo “Phòng không còn nhận lịch; kiểm tra và hủy nếu cần”. Chủ xử lý lịch cũ, không xóa lịch sử.
- Không có public GET viewing theo mã để tránh lộ liên hệ. Guest chỉ nhận receipt; liên hệ chủ để thay đổi lịch.
- Khi tạo/confirm, lock listing trước đọc lại trạng thái; khi chủ đổi availability/moderation cũng lock cùng row. Không dùng check ở FE để thay thế.

## 2.8. Đồng thời, cache và lỗi

Mutation dùng row version. 409 VERSION_CONFLICT giữ draft FE, đề nghị tải bản mới, không tự ghi đè.
Không cache public listing response ở CDN trong demo. FE query staleTime 0, refetch on focus; mutation invalidate liên quan.
Một trang đã mở trước khi tin đổi trạng thái có thể hiển thị snapshot cũ; mọi hành động phải kiểm tra lại BE.
Khi AI trả phòng, BE đọc lại public predicate sau gọi provider trước serialize.
