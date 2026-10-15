# 04 — Hợp đồng API v1

## 4.1. Quy ước

Base /api/v1. JSON UTF-8, currency VND, UUID, timestamp UTC ISO8601. GET catalog/public không cần account. Mọi POST/PATCH/DELETE (kể cả guest) cần session cookie + X-CSRF-Token; lấy trước qua GET /auth/csrf. Same-origin fetch credentials: include.

Success:
```json
{"data":{"id":"11111111-1111-4111-8111-111111111111"},"meta":{"requestId":"req_abc","generatedAt":"2026-10-07T14:00:00Z"}}
```
List: data.items; pagination nằm meta {page,pageSize,total,totalPages}. Search thêm data.markers và meta.mapTruncated/travelIncomplete. Vượt candidate cap trả 422 SEARCH_TOO_BROAD, không trả danh sách bị cắt ngầm.
Error:
```json
{"error":{"code":"VALIDATION_ERROR","message":"Vui lòng kiểm tra thông tin","fields":{"rentVnd":["Giá thuê phải lớn hơn 0"]}},"meta":{"requestId":"req_abc","generatedAt":"2026-10-07T14:00:00Z"}}
```

| HTTP | Code thường dùng | FE |
|---|---|---|
| 400 | VALIDATION_ERROR, UNKNOWN_FIELD, INVALID_FILTER | Gắn lỗi tại field |
| 401 | UNAUTHENTICATED, INVALID_CREDENTIALS | Đi login với returnTo nội bộ; không xóa draft |
| 403 | FORBIDDEN, CSRF_INVALID | Thông báo; CSRF có thể lấy lại rồi người dùng gửi lại |
| 404 | NOT_FOUND | Không tiết lộ có tin/ảnh/lịch của người khác |
| 409 | VERSION_CONFLICT, INVALID_STATE, LISTING_UNAVAILABLE, DUPLICATE_VIEWING, IDEMPOTENCY_CONFLICT, TURN_IN_PROGRESS, TURN_CONFLICT, EMAIL_EXISTS, ASSET_IN_USE | Giữ input, refetch trạng thái |
| 413 | FILE_TOO_LARGE | Chọn ảnh khác |
| 415 | UNSUPPORTED_MEDIA_TYPE | JPEG/PNG/WebP hợp lệ |
| 422 | PUBLISH_VALIDATION_FAILED, OCCUPANCY_EXCEEDED, SEARCH_TOO_BROAD | Field error/đổi giả định/thu hẹp khu vực |
| 429 | RATE_LIMITED | Đọc Retry-After, không auto retry liên tục |
| 503 | AI_UNAVAILABLE, DEPENDENCY_UNAVAILABLE | Fallback rõ hoặc cho thử lại |
| 500 | INTERNAL_ERROR | Thông báo chung, requestId |

401/403/404 precedence: route yêu cầu user kiểm tra session → role → ownership. Guest hoặc sai role không được dựa vào object ID để đọc dữ liệu.
Version conflict trả error.details.currentVersion để FE biết đã thay đổi, không gửi toàn bộ private record trong error.
Media thành công trả image/webp stream thay JSON; errors vẫn theo envelope.

## 4.2. Endpoint đầy đủ

| Method | Path (sau /api/v1) | Quyền | Operation | Body → data |
|---|---|---|---|---|
| GET | /health/live | system | healthLive: Process sống | — → Health |
| GET | /health/ready | system | healthReady: DB/storage sẵn sàng | — → Health |
| GET | /auth/csrf | public | getCsrf: Tạo/đọc guest session và cấp CSRF | — → Csrf |
| POST | /auth/register | public | registerOwner: Đăng ký owner; không auto login | RegisterRequest → User |
| POST | /auth/login | public | login: Đăng nhập, rotate session/CSRF | LoginRequest → LoginResult |
| GET | /auth/me | public | getMe: User hiện tại hoặc null | — → Me |
| POST | /auth/logout | session | logout: Hủy session | Empty → Ack |
| GET | /catalog/areas | public | getAreas: Nhóm khu vực | — → Areas |
| GET | /catalog/amenities | public | getAmenities: Tiện nghi | — → Amenities |
| GET | /catalog/places | public | getPlaces: POI đã seed, tìm theo q | — → Places |
| GET | /listings | public | searchListings: Search/list/map chung predicate | — → SearchResult |
| GET | /listings/{id} | public | getPublicListing: Chi tiết approved, kể cả rented | — → PublicListing |
| POST | /listings/{id}/estimate | public | estimateListing: Tính phí theo giả định | CostAssumptions → CostEstimate |
| POST | /listings/compare | public | compareListings: So sánh 2–3 IDs, giữ thứ tự | CompareRequest → CompareResult |
| GET | /listings/{id}/travel | public | getListingTravel: Thời gian đi lại đến POI | — → TravelEstimate |
| GET | /media/{id} | conditional | getMedia: Public approved hoặc owner/admin có quyền | — → binary |
| GET | /owner/profile | owner | getOwnerProfile: Hồ sơ của mình | — → OwnerProfile |
| PATCH | /owner/profile | owner | updateOwnerProfile: Sửa thông tin liên hệ | ProfilePatch → OwnerProfile |
| GET | /owner/dashboard | owner | getOwnerDashboard: Số liệu của chủ | — → OwnerDashboard |
| GET | /owner/listings | owner | getOwnerListings: Tin của chủ, mọi trạng thái | — → OwnerListingPage |
| POST | /owner/listings | owner | createListing: Tạo draft, owner từ session | CreateListingRequest → OwnedListing |
| GET | /owner/listings/{id} | owner | getOwnerListing: Tin của mình | — → OwnedListing |
| PATCH | /owner/listings/{id} | owner | updateListing: Sửa nội dung và imageIds | UpdateListingRequest → OwnedListing |
| POST | /owner/listings/{id}/submit | owner | submitListing: Gửi duyệt | VersionRequest → OwnedListing |
| PATCH | /owner/listings/{id}/availability | owner | updateAvailability: Đổi/xác nhận tình trạng | AvailabilityRequest → OwnedListing |
| POST | /owner/uploads | owner | uploadImage: Một file JPEG/PNG/WebP ≤5MiB | multipart → MediaAsset |
| DELETE | /owner/uploads/{id} | owner | deleteUnattachedImage: Xóa ảnh chưa gắn tin | — → Ack |
| POST | /viewings | public | createViewing: Guest gửi yêu cầu, cần idempotency | ViewingCreate → ViewingReceipt |
| GET | /owner/viewings | owner | getOwnerViewings: Lịch của các phòng mình | — → ViewingPage |
| PATCH | /owner/viewings/{id} | owner | updateViewing: Xác nhận/hủy | ViewingUpdate → Viewing |
| GET | /admin/dashboard | admin | getAdminDashboard: Số liệu kiểm duyệt | — → AdminDashboard |
| GET | /admin/listings | admin | getAdminListings: Tin mọi chủ | — → OwnerListingPage |
| GET | /admin/listings/{id} | admin | getAdminListing: Chi tiết + audit | — → AdminListingDetail |
| POST | /admin/listings/{id}/review | admin | reviewListing: Duyệt/từ chối pending | ReviewRequest → OwnedListing |
| POST | /admin/listings/{id}/hide | admin | hideListing: Ẩn approved | ReasonVersionRequest → OwnedListing |
| POST | /admin/listings/{id}/restore | admin | restoreListing: Khôi phục hidden | VersionRequest → OwnedListing |
| GET | /admin/owners | admin | getAdminOwners: Danh sách chủ trọ | — → OwnerPage |
| GET | /admin/owners/{id} | admin | getAdminOwner: Hồ sơ một chủ | — → AdminOwnerDetail |
| POST | /ai/conversations | public | createConversation: Tạo context cho session hiện tại | Empty → Conversation |
| GET | /ai/conversations/{id} | session | getConversation: Context/lịch sử của phiên này | — → Conversation |
| POST | /ai/conversations/{id}/messages | session | sendAiMessage: Lượt AI idempotent bằng clientTurnId | AiTurnRequest → AiTurnResult |

POST tạo owner/listing/upload/viewing/conversation trả 201. Các action khác và replay idempotent trả 200; response header Idempotent-Replayed=true cho replay viewing. DELETE ảnh/logout trả 200 Ack để envelope nhất quán.
Static route /listings/compare phải được đăng ký trước /listings/:id hoặc router có matching rõ ràng.

## 4.3. Search query

| Query | Kiểu/default | Quy tắc |
|---|---|---|
| q | string, rỗng | ≤200 |
| areaCode | string? | catalog |
| budgetType | rent hoặc total, default rent | áp dụng min/max |
| minPriceVnd/maxPriceVnd | integer? | 0..1.000.000.000, min≤max |
| minAreaM2/maxAreaM2 | number? | >0..1000, min≤max |
| amenities | CSV codes? | AND, unique, allowlist |
| occupants/vehicles/electricityKwh | 1 / 1 / 80 | CostAssumptions |
| destinationId | UUID? | seeded POI |
| maxTravelMinutes | integer 1..180? | cần destinationId |
| sort | newest mặc định | rent_asc,total_asc,area_desc,travel_asc |
| page/pageSize | 1 / 20 | page≥1, pageSize≤50 |
| includeMap | boolean false | marker cùng filter, tối đa 200 |
| bbox | west,south,east,north? | chỉ lọc viewport khi user bấm “Tìm trong vùng này” |

Response markers là các phòng match cùng filter, không chỉ page hiện tại. Khi click marker ngoài page, fetch detail/preview bằng ID; không đổi total. mapTruncated=true phải hiển thị “Phóng to để xem thêm”; không ngầm coi 200 là toàn bộ.
M05 quy định candidate cap áp dụng trước/ sau bước nào. Không trả số total giả khi cap vượt.

Ví dụ:
GET /api/v1/listings?areaCode=hoa-lac&budgetType=total&maxPriceVnd=3000000&amenities=private_bathroom&occupants=1&vehicles=1&electricityKwh=80&includeMap=true

## 4.4. DTO chủ trọ và listing

RegisterRequest = {displayName,email,phone,password}; role luôn do server set owner. Không nhận role từ client.
LoginRequest = {email,password}; LoginResult = {user:{id,role,email,displayName},csrfToken}.
Me = {user: User|null}. OwnerProfile = {userId,displayName,publicPhone,bio,version}.
ProfilePatch yêu cầu expectedVersion, các trường sửa; submit tin yêu cầu publicPhone.

CreateListingRequest cho phép subset các trường ListingWrite; request {} hợp lệ tạo draft.
UpdateListingRequest = ListingWrite subset + expectedVersion.
ListingWrite: title,description,areaCode,address,latitude,longitude,areaM2,maxOccupants,rentVnd,depositVnd,electricityVndPerKwh,waterVndPerPerson,internetVnd,parkingVndPerVehicle,serviceVnd,otherVnd,amenities,houseRules,imageIds.
Fields nullable/range đọc 02_DOMAIN_RULES. Không nhận ownerId,status,version (ngoài expectedVersion).
PublicListing chỉ có các trường công khai, owner {id,displayName,publicPhone}, images {id,url,sortOrder}, availabilityUpdatedAt, estimatedCost và travel. Hai key estimatedCost/travel luôn có mặt: travel=null nếu không yêu cầu điểm đến; estimatedCost=null khi hàng compare vượt sức chứa. Không trả storageKey hoặc nội dung audit.

Ví dụ update:
```json
{"expectedVersion":3,"title":"Phòng sáng thoáng khu Hòa Lạc","rentVnd":2000000,"electricityVndPerKwh":3500,"waterVndPerPerson":70000,"internetVnd":80000,"parkingVndPerVehicle":80000,"serviceVnd":50000,"otherVnd":0,"depositVnd":2000000,"imageIds":["33333333-3333-4333-8333-333333333331"]}
```

ReviewRequest = {expectedVersion,decision:"approve"|"reject",reason?:string}; reject thiếu reason →422.
AvailabilityRequest = {expectedVersion,availability:"available"|"rented"}.

## 4.5. Cost và compare

POST /listings/:id/estimate body {occupants:1,vehicles:1,electricityKwh:80}.
CostEstimate = {assumptions,lines,knownSubtotalVnd,estimatedMonthlyVnd,estimatedMoveInVnd,monthlyComplete,moveInComplete,unknownFields}.
lines: {code,unitPriceVnd,quantity,subtotalVnd}; null không phải 0.
CompareRequest = {ids:[UUID,UUID,UUID?],assumptions,destinationId?}.
CompareResult = {rows:[{id,state,listing,cost,travel}],assumptions}.
state = available | rented | unavailable | incompatible_assumptions.
Nonpublic/missing → unavailable, listing/cost/travel=null; giữ vị trí row bằng ID được client gửi, không trả title/ảnh private. approved+rented có thông tin công khai nhưng khóa CTA.
So sánh cùng một assumptions object cho tất cả hàng.

## 4.6. Booking example

POST /viewings; X-CSRF-Token; Idempotency-Key: UUID
```json
{"listingId":"11111111-1111-4111-8111-111111111111","guestName":"Khách minh họa","guestPhone":"0900000000","preferredAt":"2026-10-08T03:00:00Z","note":"Muốn xem phòng buổi sáng","consentContact":true}
```
Số điện thoại trên chỉ là fixture, không gọi thật. preferredAt trong test phải tạo tương đối server clock để không hết hạn.
Receipt = {id,receiptCode,status:"requested",preferredAt}; không trả lại guestPhone.
PATCH /owner/viewings/:id body {expectedVersion:1,status:"confirmed"} hoặc {expectedVersion:1,status:"cancelled",reason:"Phòng đã có người thuê"}.
Owner Viewing response có listing {id,title,availability,moderationStatus}, listingBookable, guestName,guestPhone,note,preferredAt,status,version,cancellationReason.

## 4.7. AI contract

POST /ai/conversations {} → {id,version:1,filters,pendingProposals:[],messages:[]}.
POST /ai/conversations/:id/messages:
```json
{"clientTurnId":"44444444-4444-4444-8444-444444444444","expectedVersion":1,"content":"Tìm phòng gần FPT Hòa Lạc, tổng dưới 3 triệu, vệ sinh riêng"}
```
AiTurnResult = {conversationId,version,clientTurnId,state,aiMode,message,filters,clarifications,recommendations,proposals}.
state: clarification|recommendations|no_match|unsupported.
aiMode: openai|rule|fallback.
recommendations: [{listing:PublicListing,reasonCodes:[...],reasons:[string]}], tối đa3; không nhận trực tiếp ID từ LLM.
proposals: [{id,label,patch}]; tiếp nhận bằng acceptedProposalId trong lượt tiếp theo, phải là proposal còn hiệu lực của cùng conversation.
Lặp clientTurnId cùng body trả lượt cũ sau rehydrate public listings; khác body 409 TURN_CONFLICT. Version tăng mỗi lượt lưu thành công, không tăng khi provider/validation thất bại.

## 4.8. Danh sách nội bộ

Owner/admin list nhận page/pageSize,q,moderationStatus?,availability?; admin thêm ownerId?,areaCode?.
Owner viewings: page/pageSize,status?,listingId?,from?,to?; from/to UTC inclusive lower/exclusive upper, from<to.
Admin owners: page/pageSize,q. Không nhận query role=admin để lộ admin.
Audit event response: action,fromStatus,toStatus,reason,actorDisplayName,createdAt,listingVersion; phục vụ admin và reason cần thiết cho owner.
