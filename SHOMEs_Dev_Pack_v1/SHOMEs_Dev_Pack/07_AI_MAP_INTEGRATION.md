# 07 — Tích hợp AI và Smart Map

## 7.1. AI architecture cụ thể

LLM = bộ trích xuất nhu cầu, không phải nguồn phòng hay giá. Pipeline:
normalize input → đọc context của session → extract IntentPatch → validate enum/range/ID → merge filter → resolve area/POI → clarify nếu cần → SearchService → RankingService → recheck public predicate → build reasons → lưu turn/context.

Chỉ gửi sang provider: câu người dùng, filter hiện tại, các tên/code area/amenity/POI phù hợp. Không gửi mật khẩu, phone của lịch, email chủ, audit note hoặc toàn DB. Nội dung tin không được coi là system instruction.

## 7.2. IntentPatch

Schema máy nằm contracts/ai-intent.schema.json:
intent = search|refine|off_topic.
set có budgetType,maxPriceVnd,areaCode,destinationQuery,maxTravelMinutes,occupants,vehicles,electricityKwh,sort. Mọi key hiện diện; null nghĩa không thay đổi.
clearFields dùng để xóa field có chủ ý. add/removeMustAmenities và add/removePreferredAmenities là danh sách code.
destinationQuery chỉ có trong IntentPatch: BE resolve thành destinationId trong filters. Clear destinationQuery xóa cả destinationId và maxTravelMinutes. Clear occupants/vehicles/electricityKwh đặt lại default 1/1/80; clear sort đặt newest. Clear budgetType đưa về chưa rõ trong AI context để hỏi lại nếu còn cap, không ngầm mặc định rent.
missingFields tối đa2, dùng để chọn câu hỏi do server tạo; không dùng LLM bịa lời giải thích về phòng.

Merge order:
1. clearFields.
2. set non-null.
3. remove amenities rồi add (dedupe).
4. Xóa maxTravelMinutes nếu destination bị clear.
5. Validate lại filter hoàn chỉnh.
6. Resolve destinationQuery trong POI catalog. Không tồn tại→hỏi vị trí khác hoặc cho dùng map; nhiều match→đưa lựa chọn.
7. Có maxPriceVnd nhưng budgetType chưa rõ→hỏi “Ngân sách là tiền thuê hay tổng chi phí?”.
8. Có maxTravelMinutes nhưng thiếu destination→hỏi địa điểm. Không tự đoán “gần” nghĩa dưới20phút.

Default occupancy1/vehicle1/kWh80 được hiển thị để chỉnh. Không tự nới hard constraint. “Rẻ hơn” khi không có mức mới đổi sort total_asc/rent_asc theo budgetType, giữ budget cap. “Bỏ ban công” xóa ban công khỏi must/preferred, không thêm điều kiện “không có ban công”.

## 7.3. Provider adapter

Interface: extractIntent({message,currentFilters,catalog,signal}) → validated IntentPatch.
Implementations:
- OpenAiIntentExtractor: Responses API structured output, model từ OPENAI_MODEL.
- RuleIntentExtractor: deterministic nhận các pattern demo (“3 triệu”, “3tr”, “Hòa Lạc”, “vệ sinh riêng”, “dưới20 phút”, “bỏ ban công”). Nếu không hiểu thì trả missingFields/hướng dẫn bộ lọc, không giả vờ hiểu.
- Fallback: chỉ chạy rule khi AI_FALLBACK_ENABLED=true, trả aiMode=fallback và UI có nhãn.

Dạng tích hợp tham chiếu (dev điều chỉnh theo SDK được pin):
```ts
const result = await client.responses.create({
  model: config.openAiModel,
  store: false,
  input: [
    { role: "system", content: extractionInstruction },
    { role: "user", content: JSON.stringify(extractionInput) }
  ],
  text: { format: { type: "json_schema", name: "rental_intent", strict: true, schema: intentSchema } }
});
```

Parse kết quả sau khi kiểm tra completed/refusal/incomplete; validate lại schema và domain enum. Không dùng string output để tạo SQL.
Timeout10s; tối đa1 retry lỗi transient trong tổng15s. Provider429/timeout/refusal hoặc invalid output → fallback/503 theo config. Không tự gọi vô hạn.
Model cụ thể do người có API account chọn trong danh sách model hỗ trợ structured outputs; không giả định mọi tài khoản truy cập cùng model hoặc gán giá phí cố định.

## 7.4. Xếp hạng xác định

Sau hard filter:
- preference: tỷ lệ preferred amenities có true; trọng số40, chỉ active khi có preferred.
- affordability: clamp(1 - selectedCost/maxPrice,0,1); trọng số30, active khi có cap và đủ cost.
- travel: clamp(1 - minutes/(maxTravelMinutes hoặc60),0,1); trọng số20, active khi có destination và travel known.
- freshness: clamp(1 - ageDays/30,0,1); trọng số10; availabilityUpdatedAt null→0.

Score = 100 × tổng(weight×value)/tổng active weights. Tie: updatedAt DESC, id ASC. Top3.
Đây là heuristic demo do nhóm thiết kế, không phải mô hình đánh giá chất lượng đã kiểm chứng. Không cần hiển thị “phù hợp 98%”; chỉ hiển thị lý do thực tế.
Freshness là thời điểm chủ cập nhật, không phải độ tin cậy được xác minh.

Reason templates lấy từ server:
- “Tổng dự kiến 2.560.000đ/tháng theo giả định bạn chọn.”
- “Có vệ sinh riêng theo thông tin chủ đăng.”
- “Thời gian đi lại 12 phút — dữ liệu minh họa” nếu source=fixture.
- Không có fact thì không sinh reason đó.

## 7.5. Không có kết quả và nới điều kiện

Server thử xây tối đa2 đề xuất: tăng cap tối đa20% hoặc bỏ 1 amenity/giới hạn travel. Chỉ là đề xuất, không tự áp dụng. Mỗi proposal lưu UUID, patch và filterVersion tại conversation.
Khách bấm chip đồng ý → gửi acceptedProposalId. BE kiểm cùng conversation/currentVersion; proposal cũ409 INVALID_STATE.
Có thể không đề xuất nếu mọi kết quả thiếu phí/travel; nói rõ thiếu dữ liệu, giữ filter.
Không thay area khác xa mà không có đồng ý.

## 7.6. Lịch sử, replay và đồng thời

Conversation gắn sessionId; GET khác session404. Browser chỉ giữ conversationId.
clientTurnId UUID cho mỗi nội dung mới; timeout retry giữ nguyên ID/body.
Kiểm turn đã lưu trước version. Replay khác request hash409. Context version tăng chỉ khi commit.
Không giữ DB transaction trong lúc gọi LLM. Mutex một conversation trong single API instance tránh hai lời gọi đồng thời; DB version là lớp bảo vệ cuối.
Recommendation snapshot trong messages chỉ để audit. Khi trả lịch sử/replay, hydrate lại IDs từ public predicate; tin đã ẩn/thuê không trở lại như card có thể đặt lịch. Message lịch sử ghi thời điểm; danh sách card có thông báo “Kết quả đã thay đổi” khi cần.

## 7.7. Smart Map và địa điểm

MapLibre render nền, marker và popup; không tự cung cấp geocoding/routing. Cấu hình VITE_MAP_STYLE_URL + attribution đúng nhà cung cấp.
Catalog places có alias search_text, areaCode, tọa độ; GET /catalog/places?q=... trả tối đa10. Demo chọn POI có sẵn hoặc pin listing; chưa tìm địa chỉ tự do.
Marker nhận tọa độ [longitude,latitude]. DB/API field tách latitude/longitude; test để tránh đảo tọa độ.
Di chuyển map không tự thay search liên tục; nút “Tìm trong vùng này” xác nhận bbox. Đổi bộ lọc reset page, giữ viewport phù hợp.
Map unavailable → danh sách vẫn hoạt động; không gắn thời gian đi lại giả.

## 7.8. TravelProvider

Interface estimate({listingId,origin,destinationId,destination,mode:"driving"}) → {status,durationSeconds,distanceMeters,source,calculatedAt,expiresAt}.
source = fixture|osrm; status = available|unavailable.
Fixture tra đúng listingId+placeId; không có row→unavailable.
OSRM adapter gọi route endpoint có coordinates lon,lat; chỉ profile thực sự được deployment hỗ trợ. Demo driving, không suy ra bike bằng hệ số.
Không dùng public demo routing server như backend production. OSRM_BASE_URL là instance/provider đã được cấu hình quyền sử dụng.
durationSeconds giữ integer; UI minutes=ceil(seconds/60); filter maxMinutes so sánh seconds≤limit×60, không so số đã round.
Cache live24h cho demo, không đại diện giao thông realtime. Khi listing lat/lng đổi xóa cache rows; POI seed đổi thì invalidation theo migration.
Batch search dùng cache; tối đa20 route cache-miss/request, concurrency4, timeout3s/request routing. Những candidate chưa tính/timeout trả unknown, meta.travelIncomplete=true. Không loại chúng rồi báo “không có phòng” như kết luận chắc chắn.
Có hard travel constraint → unknown không được nhận là match. Mời bỏ giới hạn hoặc thử lại.

## 7.9. Nghiệm thu tích hợp

- Intent extraction trên ít nhất10 câu tiếng Việt trong test plan.
- Recommendation ID thuộc DB và còn public tại thời điểm trả.
- Fee/cost giống M06; filter giống M05; card map cùng ID.
- Token/API key không có trong network response/FE bundle.
- Tắt provider vẫn dùng search/map/list bình thường; mode hiển thị đúng.
- Provider smoke chỉ đánh dấu pass khi thực sự chạy với key cấu hình; fixture pass không thay thế.
