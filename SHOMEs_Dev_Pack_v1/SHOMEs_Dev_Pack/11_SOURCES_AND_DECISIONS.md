# 11 — Nguồn và quyết định phụ thuộc môi trường

Đối chiếu tài liệu chính thức ngày07/10/2026. Rule sản phẩm/limit/endpoint là thiết kế riêng cho S:HOMEs; các nguồn kiểm tra cơ chế kỹ thuật, không chứng minh ứng dụng đã triển khai.

- [Node.js releases](https://nodejs.org/en/about/previous-releases): nhánh24 là LTS tại thời điểm đối chiếu.
- [NestJS validation](https://docs.nestjs.com/techniques/validation): DTO validation và từ chối field ngoài schema.
- [NestJS authorization](https://docs.nestjs.com/security/authorization): guards/roles.
- [Prisma transactions](https://www.prisma.io/docs/orm/fundamentals/transactions): ranh giới transaction; row lock/version là quyết định của pack.
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/): frontend rendering.
- [OSRM API](https://project-osrm.org/docs/v5.24.0/api/): coordinates/profile, duration giây/distance mét.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses): Responses text.format với JSON schema cho intent extraction.

Cần điền khi tạo repo: exact versions/lockfile, APP_ORIGIN, map style/provider có quyền dùng, OPENAI_MODEL và credential nếu live, OSRM_BASE_URL nếu routing thật, ảnh seed hợp lệ.
Chưa có mockup thành phẩm trong đầu vào. Screen IDs/flows bám prompt đã chốt; typography/spacing cuối đối chiếu thiết kế khi có. Điều này không chặn BE/domain/API hoặc FE structure.
