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

## Tích hợp báo cáo AI và kiểm thử FE — 25/11/2026

Nhánh `feat/ai-evaluation-integration` xuất phát từ main `0698f22` và nhập `feat/ai-analysis-workspace`; giữ UI AI cùng bản auth local đã làm, không ghi đè code của Sơn. Không thay model `.pkl`, cách suy luận hoặc huấn luyện lại mô hình.

- AI cung cấp `/api/v1/flood/evaluation` và bốn PNG qua `/evaluation/charts/{id}`. Gini toàn cục đọc trực tiếp từ classifier đang phục vụ, gắn đúng SHA-256 model. Các ảnh notebook được xuất từ output đã lưu bằng script stdlib, không thực thi notebook. Manifest ghi nguồn, SHA-256 nội dung JSON chuẩn hóa và SHA-256 từng PNG; Docker build xuất lại bundle.
- BE proxy JSON/PNG dưới `/api/v1/ai/flood/evaluation`, giữ kiểm tra access token và quyền quản lý. Chỉ bốn mã chart được phép; file sai/mất không trở thành kết quả dự đoán.
- FE bổ sung tab Đánh giá mô hình, tải báo cáo JSON/ảnh gốc, đổi phương pháp, phóng to ảnh bằng dialog có cuộn ngang trên mobile, lỗi/tải lại và kiểm tra phiên bản báo cáo. Gini model đang chạy tách khỏi snapshot notebook. Điểm quy đổi 90–95 được ghi rõ là xếp hạng, không phải accuracy. Không suy ngược số gốc từ ảnh hoặc gắn SHAP tổng hợp thành giải thích một điểm.

Ba lỗi thực tế được tìm thấy qua kiểm thử FE và đã sửa:

1. Hồ sơ tài khoản trả entity chứa hash mật khẩu: GET profile chuyển sang UserResponse chỉ gồm trường hồ sơ. Có test Java và kiểm tra shape response qua phiên đăng nhập thật.
2. Form đổi mật khẩu gửi currentPassword nhưng BE yêu cầu oldPassword: sửa mapping; test đổi và đăng nhập lại bằng mật khẩu mới + OTP thành công.
3. Bộ lọc đến 31/12/2023 lẫn thêm 01/01/2024 do LocalTime.MAX bị PostgreSQL làm tròn: đổi sang cận `< đầu ngày kế tiếp`. UI trả đúng 12 tháng, dữ liệu gốc không đổi.

### Kết quả kiểm tra

- 43 assertion FE luồng sản phẩm: khách, menu mobile, OTP, theo dõi khu vực, định vị emulated trong trình duyệt, nháp, tạo báo cáo, ảnh/nén/upload Cloudinary thật, góp ý, quyền, xác minh/kết thúc, thông báo/đánh dấu đọc, hủy theo dõi, CSV sai/đúng/zero/lịch sử, đánh giá AI và bốn ảnh, dialog mobile, lỗi 503/retry, hồ sơ, đổi mật khẩu và đăng xuất.
- 17 assertion FE dữ liệu/thời tiết: biểu đồ/bảng, xuất CSV, phân tích khí hậu + JSON, xác nhận đơn vị, lọc ngày, giữ xung đột nguồn, thống kê cộng đồng, OpenWeather hiện tại/không khí/dự báo/đổi ngày, responsive.
- 30 assertion FE UI AI và 10 assertion FE xác thực/khôi phục: chạy lại trên cùng bản runtime. Tổng bốn bộ là 100 assertion qua trình duyệt, không phải 100 tính năng hay chứng nhận độ chính xác mô hình.
- AI 34 pytest; Search 10 Java tests; Auth 3 Java tests; FE 6 unit tests và lint/build qua. 28 kiểm tra HTTP nghiệp vụ và 6 kiểm tra FE proxy → BE → AI cũng qua.
- Test FE đăng nhập bằng mật khẩu + OTP SMTP Mailpit, không tự ký JWT để bỏ qua login. Các mẫu suy luận, CSV, báo cáo, thời tiết và upload thành công dùng dịch vụ thật. Lỗi 503 được chèn ở mạng trình duyệt để kiểm tra UI; định vị là tọa độ mô phỏng, không phải GPS thật.
- Tài khoản, báo cáo, quan sát CSV và ảnh Cloudinary của từng lần chạy được dọn sau test. SMTP ra Internet/Gmail, thiết bị GPS thật, kiểm thử tải và đánh giá độc lập chưa được kiểm chứng trong lượt này.

### Phần chưa đủ dữ liệu / ngoài phạm vi thay đổi AI này

- Notebook chưa xuất bảng số gốc và fingerprint của pipeline dùng cho bốn thí nghiệm. UI hiển thị ảnh nguồn và trạng thái chưa xác minh liên kết, không bịa bảng số.
- Chưa có SHAP cho từng điểm dự đoán; Mean Absolute SHAP trong notebook là tổng hợp validation.
- Hệ tọa độ X/Y, đơn vị đặc trưng, kỳ tích lũy mưa và kiểm chứng Đà Nẵng còn thiếu. Chưa tự ghép dữ liệu Goong/OpenWeather thành đầu vào hay công bố tuyến đường an toàn.
- Thông báo sự cố hiện trong app; email/push cảnh báo tự động là phần mở rộng riêng, chưa được triển khai trong lượt này.
