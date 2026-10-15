# 05 — Frontend: phần việc và cách triển khai

## 5.1. Khởi tạo

Vite + React + TypeScript strict, React Router, TanStack Query, React Hook Form/Zod. Một API client dùng generated contract types, credentials:include, X-CSRF-Token cho mutation, AbortSignal cho search. Số tiền giữ number, chỉ format khi hiển thị bằng Intl.NumberFormat('vi-VN').
Không ghép UI với Prisma model. Dùng PublicListing/OwnedListing/Viewing DTO.

## 5.2. Route inventory

| Screen | Route | Guard | Thành phần chính |
|---|---|---|---|
| PUB-01 | / | public | HeroSearch, khu vực, listing cards |
| PUB-02 | /tim-phong | public | SearchFilters, Sort, ResultList, Pagination |
| PUB-03 | /tim-phong?view=map | public | MapPanel + ListPanel chung search state |
| PUB-04 | /phong/:id | public | Gallery, CostCalculator, OwnerContact, ViewingForm |
| PUB-05 | /so-sanh | public | CompareTable, giả định dùng chung |
| PUB-06 | /tro-ly-ai | public | Conversation, SearchIntentChips, cards |
| AUTH-01 | /dang-nhap | public | LoginForm, returnTo nội bộ |
| AUTH-02 | /dang-ky-chu-tro | public | RegisterOwnerForm |
| OWN-01 | /chu-tro | owner | OwnerDashboard |
| OWN-02 | /chu-tro/phong | owner | OwnerListingTable |
| OWN-03 | /chu-tro/phong/tao | owner | ListingWizard 4 bước |
| OWN-04 | /chu-tro/phong/:id/sua | owner + API ownership | Wizard có version |
| OWN-05 | /chu-tro/lich-xem | owner | ViewingInbox |
| OWN-06 | /chu-tro/ho-so | owner | OwnerProfileForm |
| ADM-01 | /admin | admin | AdminDashboard |
| ADM-02 | /admin/tin-dang | admin | ModerationQueue |
| ADM-03 | /admin/tin-dang/:id | admin | ReviewDetail + Audit |
| ADM-04 | /admin/chu-tro | admin | OwnerList + detail drawer |

Authenticated wrong role: trang 403 có link quay về khu vực đúng role. Không dùng redirect loop. Guest protected route → login; returnTo chỉ nhận relative route thuộc allowlist, tránh redirect URL ngoài.

## 5.3. State ownership

| Loại state | Nơi giữ |
|---|---|
| Dữ liệu server, user/role | TanStack Query |
| q/filter/sort/page/view/bbox/destination/assumptions | URLSearchParams, parse bằng schema |
| Form đang sửa + expectedVersion | React Hook Form; local draft trong phiên nếu cần |
| ID so sánh (≤3) | localStorage key shomes.compare.v1, không lưu giá/PII |
| ConversationId | sessionStorage; nội dung/context chuẩn trên server |
| CSRF token | Memory API client, lấy lại qua /auth/csrf |
| Map selected marker, modal, upload progress | local component/store |
| Role thực tế | chỉ /auth/me, không lấy localStorage |

Lọc debounce 300ms; đổi filter/sort/assumptions reset page=1. Cancel request cũ; không để response cũ ghi đè query mới. Link quay lại từ detail dùng URL trước đó.

## 5.4. Query keys và invalidation

- ['me']; ['catalog','areas']; ['catalog','amenities']; ['places',q].
- ['search',normalizedFilters]; ['publicListing',id,assumptions,destinationId].
- ['compare',ids,assumptions,destinationId].
- ['ownerListings',filters]; ['ownerListing',id]; ['ownerDashboard'].
- ['adminListings',filters]; ['adminListing',id]; ['adminDashboard']; ['adminOwners',filters].
- ['ownerViewings',filters]; ['conversation',id].

Listing mutation: invalidate listing-specific + owner/admin lists/dashboard + public search/detail/compare. Không giả lập đã duyệt optimistic.
Viewing mutation: invalidate owner inbox/dashboard. Booking success không làm availability=rented.
Auth change/logout: remove private query cache + conversation session key; public compare IDs có thể giữ. Không để role mới thấy inbox của role trước.
Public staleTime=0, refetchOnWindowFocus=true; owner inbox polling30s chỉ khi tab visible. Nếu cần map realtime mạnh hơn là scope sau.

## 5.5. Form chủ trọ

Bước1 basic; bước2 location/amenities; bước3 fee; bước4 images/preview.
Khi tạo mới, gọi POST owner/listings {} lấy draft id trước attach thông tin, chỉ một lần (disable create khi loading).
Upload ảnh gọi API riêng → nhận assetId và previewURL → cập nhật imageIds trong form; chưa sửa listing cho tới bấm Lưu.
Gửi duyệt: save PATCH (version hiện tại) → nhận version mới → POST submit. Nếu tin approved, PATCH đủ dữ liệu tự chuyển pending nên không gọi submit lần nữa. UI xử lý theo status trả về, không giả định.
Nếu save draft thiếu trường, validation nhẹ; nếu submit dùng full publish schema.
Một ảnh đại diện là imageIds[0]. Drag reorder cập nhật array; remove khỏi form chỉ detach khi save; có thể dọn asset unattached bằng API.
Preview gọi hàm cost shared với cùng giả định, có nhãn dự kiến.

Khi approved sửa: confirm “Tin sẽ tạm ngừng công khai để duyệt lại”; cancel giữ form. Nếu 409: giữ bản nhập, tải bản server trong panel so sánh đơn giản hoặc yêu cầu reload, không auto overwrite.
Không làm autosave liên tục cho approved vì mỗi autosave sẽ đưa tin chờ duyệt.

## 5.6. Public UI states

Mỗi fetch có loading/success/empty/error; detail thêm rented/404. Lỗi image có placeholder. Fee unknown có dấu “Chưa rõ”, tuyệt đối không format thành 0đ.
Search reset button hoạt động; map lỗi vẫn dùng danh sách. AI lỗi vẫn có bộ lọc thủ công.
Compare 0/1 selected: hướng dẫn thêm phòng; 2/3 selected mới gọi compare. Khi room unavailable giữ placeholder row và nút bỏ.
Viewing submit pending: disable, giữ idempotency key cho cùng payload khi retry do timeout. Sửa payload tạo key mới. Đổi listing/reset form tạo key mới.
Gửi thành công chỉ nói chờ chủ xác nhận; không tự mở email, Zalo hoặc gọi điện.

## 5.7. Accessibility và responsive

Desktop split map/list; mobile tabs và filter drawer. Mỗi input có label, lỗi aria-describedby, modal trap focus và Escape, button đủ vùng nhấn. Keyboard dùng được form và so sánh; map có danh sách tương đương.
Không dùng badge màu để biểu đạt duy nhất. Không render HTML từ listing/AI: plain text hoặc renderer Markdown không cho raw HTML.

## 5.8. Làm việc trước khi BE xong

Mock API responses phải đúng OpenAPI và cùng case fixture. Đặt adapter ở API boundary (MSW hoặc mock transport), không hardcode trong screen. Cùng test chạy với mock và sau đó smoke API thật.
VITE_DATA_MODE=api bắt buộc cho integrated demo. Thanh switch role kiểu prototype chỉ tồn tại trong mock mode local; bản API không có endpoint giả mạo role. Muốn đổi tài khoản trong demo dùng logout/login thật.
