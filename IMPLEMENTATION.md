# Kết quả triển khai ngày 12/11/2026

Phạm vi: thiết kế lại FE bằng taste-skill + impeccable; thực hiện luồng báo cáo và các cải tiến ngoài AI. Source AI được đối chiếu với nhánh ban đầu và không có thay đổi.

## Đã triển khai

- [x] Vòng đời báo cáo; tách xác minh/diễn biến; quyền quản lý; lịch sử; chống gửi trùng theo owner và idempotency key.
- [x] Danh sách công khai/cá nhân/quản lý có phân trang và bộ lọc; bản đồ; chi tiết; cập nhật cộng đồng; gộp báo cáo với liên kết gốc và khóa cập nhật đồng thời.
- [x] Khu vực quan tâm, thông báo trong ứng dụng và thống kê nhóm điểm có nhiều báo cáo ngập đã xác minh.
- [x] Nhập quan sát CSV có ánh xạ cột, xem trước, kiểm tra đơn vị/bản ghi trùng, tải lỗi và lịch sử nhập.
- [x] Danh mục đối tượng/chỉ số/năm động; giữ giá trị nguồn; chuỗi trùng thời điểm hiển thị bảng để đối chiếu.
- [x] Giao diện map-first công khai; biểu mẫu dùng multipart; ảnh nén; định vị; bản nháp; gợi ý báo cáo gần đây; trạng thái lỗi và thử lại.
- [x] Thiết kế lại tài khoản, hồ sơ và thời tiết; từng nguồn thời tiết tải độc lập.
- [x] Logo, favicon và banner SVG mới; README dùng banner trong repo.
- [x] Cấu hình dev/production proxy thống nhất, script cấu hình và khởi động, sao lưu database, Flyway migration báo cáo, Docker Java 21 runtime được thay mới.
- [x] Thay các secret ghi cứng trong cấu hình đang phát hành bằng biến môi trường.

## Kiểm chứng đã thực hiện

- Build frontend production thành công; ESLint phần mới `src/workspace` và `src/App.jsx` qua.
- Bốn module Java liên quan đóng gói thành công. Hai bài kiểm tra bảo mật/validation `IncidentSecurityTests`: 0 lỗi, 0 bỏ qua.
- 28 lượt kiểm tra HTTP tích hợp qua: quyền, mục đích token, owner, retry, xác minh, xung đột phiên bản, kết thúc, gộp, thông báo, catalog, CSV lỗi và CSV hợp lệ/commit lại.
- 19 kiểm tra trình duyệt qua ở 1440/768/390px và các luồng công khai, menu điện thoại, lưu nháp, gửi thật sang chi tiết, danh sách của tôi, chặn UI quản lý và dữ liệu thật. Fixture tạm được xóa sau khi kiểm tra.
- Bản Docker frontend chạy cổng 4173; trang chính và proxy API báo cáo/catalog trả HTTP 200.
- Đã sao lưu ba database trước migration. Flyway V1/V2 chạy thành công trên database hiện có.

Đây là kiểm tra chức năng local, không phải kiểm thử tải hoặc chứng minh độ chính xác dự báo. Không coi package có `-DskipTests` là toàn bộ bộ test Java đã qua. Các ApplicationTests phụ thuộc hạ tầng cũ chưa được chứng minh chạy độc lập.

## Giới hạn có chủ đích và phần cần tiếp tục

- Không triển khai AI, dự báo ngập hay chỉ đường an toàn. Dữ liệu chưa đủ để cam kết an toàn tuyến đường hoặc quan hệ nhân quả mưa/ngập.
- Thông báo trong ứng dụng; chưa có email/push tự động cho sự cố.
- Upload ảnh đồng bộ có timeout và nằm ngoài transaction; chưa dùng hàng đợi nền. Chưa kiểm chứng lần gửi OTP/Cloudinary thực tế trong phiên kiểm thử này.
- Gợi ý trùng dựa trên tối đa 200 báo cáo cùng loại gần đây; chưa phải truy vấn địa lý toàn bộ dữ liệu.
- Thống kê nhóm theo ô 0,01 độ; không đồng nhất với phường hoặc cùng địa chỉ.
- CSV nhập quan sát mới cho đối tượng/chỉ số có sẵn; không tự tạo đối tượng, không tự sửa đơn vị hay ghi đè số liệu cũ.
- Dữ liệu cũ chưa có owner không được gán lại tùy ý. Giữ nguyên các báo cáo cũ với diễn biến chưa rõ.
- Chưa đo baseline tải/p50/p95 trước và sau; không công bố số liệu hiệu năng cải thiện tùy ý.

## Thiết kế và đánh giá

Taste direction: achromatic-ledger, seed 790971946. Giao diện dùng Geist, nền xám xanh nhẹ, panel trắng phẳng, màu cho dữ liệu/trạng thái; bản đồ và hai chiều trạng thái là yếu tố chính.

Đã chạy detector của impeccable một lần; chỉ có hai cảnh báo về độ phổ biến của Geist. Giữ font này theo direction của taste-skill. Đã chụp và kiểm tra giao diện desktop/tablet/mobile, sửa lỗi canvas làm tăng chiều cao và tránh overlay che attribution bản đồ.

Reviewer độc lập không khởi chạy được do model route của công cụ không khả dụng. Đã dùng quy trình reviewer/documenter dự phòng trong cùng luồng; đây không phải đánh giá độc lập. DESIGN.md và .impeccable/design.json được ghi từ source cuối cùng.

## Phát hành

Repo đích người dùng chỉ định: https://github.com/BTL-MNM-Haui/DaNang_EcoWarning.git.

Bản phát hành tạo commit khởi đầu mới từ cây source đã làm sạch để không mang theo secret trong lịch sử repo gốc. Nhánh và remote gốc vẫn được giữ trên máy. File .env, dump database, ảnh kiểm tra và cache không đưa lên repo.

## Tinh chỉnh bố cục và điều hướng

- Rail desktop mở khi hover/focus, không đẩy bản đồ; Escape về nội dung, menu cảm ứng đóng sau điều hướng.
- Header và bộ lọc gọn hơn, bộ lọc nâng cao thu mở, trạng thái rỗng có hành động, ẩn phân trang khi không cần.
- 35 kiểm tra trình duyệt về hover, focus, menu, overflow và các trang bản đồ/thời tiết/dữ liệu/đăng nhập ở 1440/1024/768/390px đã qua. Kiểm tra giao diện không thay cho nghiên cứu khả dụng với người dùng thật.
- Đề xuất style, logo và bước UX tiếp theo trong docs/UI-DIRECTION.md.
## Thiết kế lại bố cục trên feature branch

- Sửa nguyên nhân che nội dung: sidebar mở trong cột grid riêng thay cho overlay; đã kiểm tra trên trang thời tiết, dữ liệu và bản đồ.
- Thời tiết: tổng quan xanh biển, chỉ số không khí riêng, dải dự báo theo giờ và bảng chi tiết có thể mở. Dữ liệu vẫn lấy từ OpenWeather.
- Dữ liệu: cột bộ chọn riêng và vùng biểu đồ/bảng. Bản đồ desktop rộng có bảng báo cáo nổi; điện thoại chuyển Bản đồ / Danh sách.
- 41 kiểm tra điều hướng/bố cục và 29 kiểm tra bổ sung trên bản production đã qua, gồm các chiều rộng 320/390/768/1024/1440px và đổi ngày dự báo. Lint và build production qua.
- Đã xem ảnh desktop/mobile. Detector layout không có phát hiện. Taste inspector 0 FAIL, 2 WARN: diện tích màu đậm được giữ theo yêu cầu tăng bản sắc; khoảng trống trong dải dự báo giữ để đồng nhất mốc giờ.
- Các lượt sửa dùng feature branch; không push trực tiếp main theo yêu cầu mới của người dùng.
## Rà soát tổng thể theo phản hồi về khả năng đọc

- Đã thay thang chữ chung bằng Be Vietnam Pro tự host: nội dung 16px, điều khiển 16px, tiêu đề 32px; tăng tương phản chữ phụ và biên input.
- Trang dữ liệu được thiết kế lại: bộ chọn ngang có nhóm chỉ số, tên và đơn vị rõ; phạm vi theo tập đang chọn; chuyển biểu đồ/bảng; đối chiếu xung đột; tải CSV của tập đang lọc. Tách thống kê ngập cộng đồng khỏi dữ liệu lịch sử.
- API thống nhất nhãn đơn vị ở catalog, danh sách chỉ số và lịch sử, kèm unitRaw. Không quy đổi hay viết lại dữ liệu lưu trữ. Giữ và đánh dấu điểm xung đột, dùng khoảng ngắt trong trend; không đổi thiếu dữ liệu thành zero.
- Tài khoản desktop chia hai cột; các biểu mẫu, danh sách cộng đồng, quản lý, nhập CSV và trạng thái rỗng dùng cùng hệ thống chữ và bề mặt.
- Sửa sidebar không thu sau click: chỉ keyboard focus-visible giữ menu. Grid chuyển 180ms và bản đồ gộp resize; loading là ô nội dung gọn.
- Kết quả: 4 Java test, 3 FE data test, 28 HTTP checks hiện có, 143 contract assertions, 27 navigation assertions, 138 layout assertions qua. Các bộ kiểm tra có phạm vi khác nhau, không cộng gộp thành một chứng nhận chất lượng sản phẩm.
- Bằng chứng hai skill và ảnh tại docs/SKILL-REVIEW.md. Taste inspector: 0 FAIL/0 WARN trên trang dữ liệu; impeccable có một cảnh báo giữ đường dưới tab, đã giải thích trong báo cáo.
- Đã dùng nhánh feat/friendly-layout-redesign; không cập nhật main. Chưa kiểm chứng dịch vụ gửi OTP/Cloudinary thực tế hay độ đúng chuyên môn của CSV. AI không thay đổi.
