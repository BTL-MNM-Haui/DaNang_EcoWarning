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

## Giám sát và giới hạn

- Health Report Service: `http://localhost:8083/actuator/health`; chỉ công khai trạng thái, không công khai cấu hình.
- Xem log: `docker compose -p backend -f docker-compose.yml -f docker-compose.dev.yml logs --tail 100 citizen-report-service`.
- Thông báo hiện trong ứng dụng, phát sinh khi quản lý xác minh/cập nhật sự cố trong bán kính khu vực theo dõi. Chưa gửi email/push tự động.
- Ảnh được nén trên trình duyệt. Upload server vẫn đồng bộ, có timeout và nằm ngoài transaction ghi báo cáo; chưa triển khai hàng đợi nền.
- Gợi ý trùng dùng các báo cáo cùng loại trong tập gần đây, không phải tìm kiếm địa lý toàn bộ database.
- Thống kê tái diễn nhóm theo ô tọa độ 0,01°, không kết luận cùng một địa chỉ hoặc quan hệ nhân quả với mưa.
- Chưa có số đo tải hoặc độ chính xác dự báo để công bố. Không triển khai AI hoặc chỉ đường “an toàn”.
