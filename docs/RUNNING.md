# Chạy và kiểm tra EcoWarning

## Khởi động mới

Yêu cầu Docker Compose và Node.js 22. Không cần cài Java/Maven trên máy.

```bash
node scripts/configure.mjs
```

Lệnh tạo `backend/.env` nếu chưa có, dùng mật khẩu và khóa JWT ngẫu nhiên. Điền các khóa tùy chọn trong file này: Goong cho bản đồ, OpenWeather cho thời tiết, SMTP cho OTP, Cloudinary cho ảnh. Khóa thiếu sẽ làm tính năng tương ứng báo lỗi hoặc yêu cầu cấu hình; không có dữ liệu giả thay thế. Khóa frontend gửi đến trình duyệt phải được giới hạn domain/quota tại nhà cung cấp.

Windows:

```powershell
.\scripts\start.ps1
```

Linux/macOS:

```bash
sh scripts/start.sh
```

Mở `http://localhost:4173`. Xem bản đồ/dữ liệu không cần đăng nhập; gửi báo cáo cần tài khoản và OTP email.

### Thử đăng nhập và khôi phục tài khoản khi chưa có SMTP thật

Windows: chạy `./scripts/start.ps1 -LocalMail` tại gốc repo. Linux/macOS: `LOCAL_MAIL=1 sh scripts/start.sh`.
Chế độ này thêm Mailpit, chỉ mở hộp thư tại `http://localhost:8025` trên máy local. Email được giữ trong hộp thư thử, không gửi đến Gmail hay người nhận bên ngoài. Cấu hình SMTP thật trong `.env` được giữ nguyên; bỏ tùy chọn LocalMail khi muốn quay lại SMTP thật.

Sau khi Auth Service sẵn sàng, chạy `node scripts/prepare-local-test-accounts.mjs` tại gốc repo. Lệnh tạo hai tài khoản thử riêng USER/ADMIN và ghi email/mật khẩu vào `.delivery/local-test-accounts.json` (đã bỏ qua trong Git), không đổi mật khẩu tài khoản cũ. Lần chạy sau giữ lại file đã có.

1. Mở `http://localhost:4173/login`, nhập email/mật khẩu từ file local.
2. Mở `http://localhost:8025`, chọn email gửi đúng tài khoản và lấy OTP mới nhất. Nhập OTP trong 2 phút.
3. Với USER, thử gửi báo cáo và xem Báo cáo của tôi. Với ADMIN, mở Quản lý để xác minh/xử lý báo cáo. Có thể dùng hai cửa sổ hoặc cửa sổ ẩn danh để giữ hai phiên riêng.
4. Với Quên mật khẩu, nhập email tài khoản thử, lấy OTP mới từ Mailpit, đặt mật khẩu mới rồi đăng nhập lại bằng mật khẩu mới và OTP đăng nhập mới.

Không có OTP cố định hay cơ chế bỏ qua xác thực. Nếu đổi mật khẩu thủ công, cập nhật ghi chú mật khẩu local của anh; file JSON không tự đồng bộ với database.

Regression test trên Chrome/Edge cài sẵn: đặt `TASTE_SKILL_DIR` trỏ tới thư mục taste-skill có `scripts/lib/cdp.mjs`, rồi chạy `node scripts/ui-auth-flow-check.mjs`. Test thực hiện form đăng ký, đăng nhập/OTP sai và đúng, khôi phục, từ chối mật khẩu cũ và đăng nhập bằng mật khẩu mới; dùng SMTP Mailpit thực, không tự ký JWT. Tài khoản test được xóa sau khi chạy; ảnh bằng chứng nằm trong `.taste-skill/auth-flow/`.

CORS local của Auth cho phép các origin localhost/127.0.0.1 cổng 4173 và 5173. Khi đổi cổng/domain, cấu hình `CORS_ALLOWED_ORIGINS` tương ứng; không mở wildcard cho tất cả domain. Các request HTTP không có header Origin không đủ để kiểm chứng CORS của trình duyệt.

Tham khảo cấu hình hộp thư: [tài liệu Docker chính thức của Mailpit](https://mailpit.axllent.org/docs/install/docker/).

## Phát triển frontend

Khởi động backend trước, sau đó:

```bash
cd frontend/Danang_EcoWarning_FE
npm ci
```

Tạo `.env` theo `.env.example` để cấu hình khóa Goong và OpenWeather cho dev. Chạy:

```bash
npm run dev
```

Vite proxy `/backend/auth`, `/backend/reports`, `/backend/data`, `/backend/collector` đến các cổng 8084, 8083, 8082, 8081. Bản Docker dùng Nginx với cùng đường dẫn. Không đưa secret server vào biến `VITE_*`.

## Quyền quản lý

Đăng ký tài khoản trước. Chủ máy có thể cấp quyền cho đúng tài khoản local:

```powershell
.\scripts\grant-manager.ps1 -Email 'email-cua-nguoi-quan-ly@example.com'
```

Sau đó đăng nhập lại để nhận access token có quyền mới. API vẫn kiểm tra chữ ký, thời hạn và mục đích token; sửa role trong localStorage không cấp quyền ở backend. Các token tạo trước bản nâng cấp cần đăng nhập lại. Token OTP và refresh không dùng được cho API báo cáo.

## Database cũ và migration

Flyway của Report Service bổ sung cột và bảng, không xóa dữ liệu. Báo cáo cũ chưa có danh tính người gửi được giữ với owner rỗng và diễn biến chưa rõ; không tự gán chúng cho một tài khoản. V2 giữ tuổi cập nhật theo thời gian gốc của báo cáo cũ.

Trước khi nâng cấp, sao lưu:

```powershell
.\scripts\backup.ps1
```

Các file dump nằm trong `backups/`, đã được loại khỏi Git. Để phục hồi, dùng `pg_restore` vào database kiểm tra riêng trước; không ghi đè database đang chạy khi chưa đối chiếu bản sao.

Giữ project Compose `backend` để dùng đúng volume PostgreSQL hiện có. `POSTGRES_PASSWORD` trong `.env` phải khớp mật khẩu thực tế của volume cũ; đổi biến môi trường không tự đổi mật khẩu bên trong database. `REDIS_VOLUME` chọn volume Redis 7 riêng để tránh đọc snapshot không tương thích. Không dùng `docker compose down -v` khi cần giữ dữ liệu.

## Kiểm thử

Kiểm tra FE:

```bash
cd frontend/Danang_EcoWarning_FE
npm run build
npx eslint src/workspace src/App.jsx
```

Kiểm tra bảo mật/validation không phụ thuộc hạ tầng, trong thư mục module Report Service:

```bash
./mvnw test -Dtest=IncidentSecurityTests
```

Nếu module không có wrapper, dùng Maven 3.9+ với JDK 21 hoặc image `maven:3.9.6-eclipse-temurin-21`, mount module vào `/app` và chạy `mvn test -Dtest=IncidentSecurityTests`.

Khi backend local đang chạy, từ gốc repo:

```bash
node scripts/integration-test.mjs
```

Script dùng khóa JWT local và tài khoản `example.invalid` tạm thời để kiểm tra API. Nó cần Docker CLI để chuẩn bị và xóa fixture; không chạy với production. Kiểm tra quyền, mục đích token, owner, gửi lại, xác minh, xung đột phiên bản, kết thúc, gộp, thông báo và nhập CSV. Fixture được dọn trong `finally`; kết quả kiểm thử không phải dữ liệu sử dụng của sản phẩm.

Các `ApplicationTests.contextLoads` cũ cần Config Server, database và biến môi trường; không coi bước package có `-DskipTests` là toàn bộ bộ test đã qua.

## API model ngập thử nghiệm

Từ gốc repo, bật service độc lập trong mạng Docker của BE:

```bash
docker compose -f backend/docker-compose.yml --profile ai up -d --build ai-service
```

BE cùng mạng gọi `http://ai-service:8000/api/v1/flood/predict`; trên host dùng
`http://127.0.0.1:8000`. Swagger tại `http://127.0.0.1:8000/docs`.
Xem [hợp đồng dữ liệu, chạy Python local và kiểm thử](../AI/README.md).
API yêu cầu đủ 9 khóa đặc trưng từ BE; đã nối vào FE tại `/ai`, chưa tự thu thập dữ liệu GIS.

## Giám sát và giới hạn

- Health Report Service: `http://localhost:8083/actuator/health`; chỉ công khai trạng thái, không công khai cấu hình.
- Xem log: `docker compose -p backend -f docker-compose.yml -f docker-compose.dev.yml logs --tail 100 citizen-report-service`.
- Thông báo hiện trong ứng dụng, phát sinh khi quản lý xác minh/cập nhật sự cố trong bán kính khu vực theo dõi. Chưa gửi email/push tự động.
- Ảnh được nén trên trình duyệt. Upload server vẫn đồng bộ, có timeout và nằm ngoài transaction ghi báo cáo; chưa triển khai hàng đợi nền.
- Gợi ý trùng dùng các báo cáo cùng loại trong tập gần đây, không phải tìm kiếm địa lý toàn bộ database.
- Thống kê tái diễn nhóm theo ô tọa độ 0,01°, không kết luận cùng một địa chỉ hoặc quan hệ nhân quả với mưa.
- Chưa có số đo tải hoặc độ chính xác dự báo tại Đà Nẵng để công bố. API AI hiện phục vụ thử nghiệm tính dễ ngập theo model được cung cấp, chưa có dự báo theo thời gian hoặc chỉ đường “an toàn”.
## Tích hợp AI và phân tích khí hậu (18/11/2026)

Script start hiện bật profile ai. FE `/ai` hiển thị công khai phần chuẩn bị dữ liệu; chạy model cần quyền quản lý. `/ai-flood` chuyển hướng về `/ai`. UI gọi `/backend/data/api/v1/ai/flood/*` qua Search Service, rồi đến AI nội bộ. Mô hình hiện chưa kiểm chứng cho Đà Nẵng; chuẩn bị đủ đặc trưng theo metadata trước khi dùng dữ liệu thực địa. Phân tích bất thường khí hậu nằm ở `/data`, kiểm tra đơn vị/độ bao phủ và dùng API `/metric/anomalies`. Xem docs/PLAN-AUDIT-2026-11-18.md để biết phần đã hoàn thành, kiểm thử và các điều kiện dữ liệu còn thiếu.

### Kiểm tra màn hình AI (25/11/2026)

1. Mở `http://localhost:4173/ai`; menu chính và đầu trang bản đồ đều có lối vào. Khách xem được form và mẫu, chưa có kết quả tự tạo.
2. Chọn Đăng nhập để chạy AI, dùng tài khoản ADMIN từ `.delivery/local-test-accounts.json` và OTP trong Mailpit. Đăng nhập xong quay lại `/ai`.
3. Chọn Nạp mẫu nhãn không ngập hoặc Nạp mẫu nhãn ngập, sau đó Phân tích đầu vào. Kết quả được trả từ Python qua Search Service, hiển thị nhãn, điểm lớp Flood, đặc trưng điền khuyết và phiên bản.
4. Thử sửa một trường: kết quả cũ được xóa. Trường trống/NoData cần xác nhận điền khuyết; tất cả trường thiếu bị từ chối. Zero được giữ nguyên.
5. Có thể nhập JSON trong phần mở rộng và tải JSON đầu vào/kết quả. Đây là mẫu dataset của nhóm AI, không phải dữ liệu quan trắc tại Đà Nẵng.

Kiểm tra tự động tại gốc repo sau khi bật LocalMail và chuẩn bị hai tài khoản thử:

```powershell
$env:TASTE_SKILL_DIR='E:\mnm haui\taste-skill\skills\taste-skill'
node scripts/ui-ai-workspace-check.mjs
node scripts/ai-integration-check.mjs
node --test frontend/Danang_EcoWarning_FE/src/workspace/floodForm.test.mjs
```

Script browser dùng mật khẩu + OTP qua SMTP local, không tự ký JWT. Trường hợp 503 được chèn tại lớp mạng trình duyệt để kiểm tra UI; các mẫu dự đoán thành công gọi BE và model thật. Script không đổi mật khẩu hoặc xóa hai tài khoản thử.

## Báo cáo đánh giá model và kiểm thử FE đầy đủ

Mở `http://localhost:4173/ai?view=evaluation` bằng tài khoản ADMIN. Tab có Gini của artifact đang phục vụ, bốn ảnh output notebook, nguồn/công thức quy đổi và tải JSON. Nút Phóng to mở ảnh ở kích thước dễ đọc, có cuộn ngang trên điện thoại. Các ảnh lấy bằng Axios có access token qua BE, không gắn token vào URL.

Notebook chưa có bảng số gốc cho các thí nghiệm và chưa có fingerprint liên kết pipeline đánh giá với model triển khai. Không dùng điểm xếp hạng 90–95 làm accuracy. Docker build AI tự xuất snapshot bằng `AI/tools/export_notebook_evaluation.py`, không chạy notebook hay train model. Nếu sửa notebook nhưng chưa có output hợp lệ, bước export sẽ yêu cầu xem lại; dữ liệu nguồn không bị sửa.

Chạy kiểm thử tại gốc repo sau `./scripts/start.ps1 -LocalMail` và `node scripts/prepare-local-test-accounts.mjs`:

```powershell
$env:TASTE_SKILL_DIR='E:\mnm haui\taste-skill\skills\taste-skill'
node scripts/ui-product-flow-check.mjs
node scripts/ui-data-weather-check.mjs
node scripts/ui-ai-workspace-check.mjs
node scripts/ui-auth-flow-check.mjs
```

Hai script mới kiểm tra bằng thao tác form trên Chrome/Edge, đọc trạng thái DOM và gọi API thật từ FE. Script product tạo fixture local riêng, cấp quyền ADMIN cho fixture, gửi OTP qua Mailpit, upload ảnh ghi rõ AUTOMATED TEST lên Cloudinary cấu hình trong backend/.env và xóa ảnh do chính lần chạy đó tạo ra theo [API destroy chính thức](https://cloudinary.com/documentation/image_upload_api_reference#destroy). Nó cũng dọn báo cáo, tài khoản và CSV thử. Cần khóa Cloudinary, Goong và OpenWeather hợp lệ để kiểm tra các phần tương ứng; không có dữ liệu giả thay thế nếu dịch vụ ngoài không hoạt động. Không dùng script có ghi dữ liệu với môi trường production.

Ảnh/checklist local ở `.taste-skill/product-flow-proof/`, `.taste-skill/data-weather-proof/`, `.taste-skill/ai-workspace-proof/`, `.taste-skill/auth-flow/`. Tổng hợp kết quả và phần còn thiếu trong IMPLEMENTATION.md, mục 25/11/2026. Các kiểm tra này không chứng minh độ chính xác dự báo tại Đà Nẵng.

### Đăng nhập bằng mật khẩu cho tài khoản local được chọn

Chế độ LocalMail kích hoạt profile `local-demo`. Mặc định mọi tài khoản vẫn cần OTP. Chủ máy có thể đặt `LOCAL_PASSWORD_LOGIN_ACCOUNTS` trong `backend/.env` thành danh sách email local phân tách dấu phẩy rồi chạy lại `./scripts/start.ps1 -LocalMail`. Chỉ các email khớp chính xác trong danh sách mới nhận access/refresh token ngay sau khi mật khẩu hợp lệ. Ngoài profile local-demo, danh sách không có hiệu lực. Xóa giá trị để yêu cầu OTP lại.

API `/auth/otp-sign-in` trả `otpRequired: false` cùng token đăng nhập cho tài khoản được chọn; FE nhận phản hồi này và vào ứng dụng ngay. Tài khoản khác vẫn nhận `otpRequired: true` và OTP challenge. Luồng khôi phục mật khẩu vẫn yêu cầu OTP; quyền USER/ADMIN không bị thay đổi. Danh sách email và mật khẩu cụ thể chỉ lưu local, không bật sẵn trong source công khai.

Kiểm tra local riêng cho hai tài khoản được chủ máy yêu cầu: `node scripts/ui-local-password-login-check.mjs`, cần `.delivery/anh-local-accounts.json` và `TASTE_SKILL_DIR` như các test browser khác. Script kiểm tra mật khẩu sai, đăng nhập trực tiếp, token thật/quyền thật và không phát sinh email OTP đăng nhập. `ui-auth-flow-check.mjs` tiếp tục kiểm tra OTP trên tài khoản ngoài danh sách.
