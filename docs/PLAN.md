# Đánh giá chức năng và đề xuất cải tiến DaNang EcoWarning

Ngày lập: 03/11/2026
Phạm vi: Báo cáo dự án, mã nguồn frontend và backend tại `E:\Danang_EcoWarning\DaNang_EcoWarning`, cùng kết quả khởi động local.

Tài liệu này đề xuất tập trung phát triển chức năng theo dõi và báo cáo ngập tại Đà Nẵng. Dự án đã có nền tảng dữ liệu, bản đồ, tài khoản và tiếp nhận báo cáo, nhưng cần hoàn thiện luồng từ người dân gửi thông tin đến xác minh, công khai và cập nhật khi sự cố kết thúc.

Các mục “đã có” nghĩa là đã tìm thấy mã triển khai. Việc API phản hồi và frontend build thành công chưa chứng minh mọi luồng nghiệp vụ hoạt động đầy đủ. Các đề xuất dưới đây chưa được triển khai trong phạm vi đánh giá này.

## 1. Chức năng hiện có

| Nhóm chức năng | Nội dung đã có | Mức độ và giới hạn |
| --- | --- | --- |
| Tài khoản | Đăng ký, đăng nhập bằng mật khẩu và OTP email, đăng xuất, làm mới token | Có giao diện và API; phụ thuộc dịch vụ gửi email để hoàn tất OTP |
| Hồ sơ cá nhân | Xem và cập nhật thông tin, đổi mật khẩu | Có giao diện và API |
| Quên mật khẩu | Gửi OTP, xác minh và đặt lại mật khẩu | Có giao diện và API |
| Thời tiết | Thời tiết hiện tại, dự báo, chọn ngày xem biểu đồ, chất lượng không khí | Gọi API bên ngoài; tọa độ đang cố định tại Đà Nẵng |
| Bản đồ | Hiển thị các điểm theo nhóm, chọn điểm để xem thông tin và dữ liệu mới nhất | Các nhóm trên bộ chọn gồm khu vực sạt lở, nhà trú bão, hồ ao, hồ thủy lợi, trạm cảnh báo ven biển và trạm đo mưa |
| Thống kê | Biểu đồ khí hậu, nông nghiệp, thiệt hại thiên tai theo năm và thông tin chi tiết | Có tương tác chọn chỉ số, chọn năm; một số năm và ID đối tượng còn ghi cố định trong frontend |
| Tra cứu | Danh sách đối tượng, hồ sơ đối tượng, chỉ số và lịch sử quan trắc, lọc dữ liệu nông nghiệp | Có API; mức độ khai thác trên giao diện chưa đồng đều |
| Báo cáo cộng đồng | Nhập loại sự cố, mô tả, tọa độ, địa chỉ, ảnh và chi tiết theo loại | Có biểu mẫu và API tạo báo cáo; định dạng gửi giữa frontend và backend chưa khớp |
| Nhập dữ liệu | Đọc CSV, tạo đối tượng và dữ liệu quan trắc, ghi nhật ký nhập | Chủ yếu khởi tạo khi database chưa có dữ liệu; chưa phải quy trình cập nhật dữ liệu hoàn chỉnh cho cán bộ |
| Hạ tầng | API Gateway, Config Server, Eureka, PostgreSQL, Redis, Docker | Đã khởi động local; cần thống nhất cấu hình để tái lập môi trường thuận tiện |

### 1.1. Các loại báo cáo trên giao diện

Biểu mẫu hiện có 11 lựa chọn:

1. Bão hoặc áp thấp.
2. Lốc xoáy hoặc gió giật.
3. Sét.
4. Ngập lụt.
5. Lũ quét.
6. Sạt lở.
7. Cháy rừng.
8. Cháy nổ tại khu dân cư hoặc khu công nghiệp.
9. Cây ngã, đổ.
10. Đứt dây điện.
11. Kẹt xe nghiêm trọng.

Các trường chi tiết riêng mới tập trung vào bốn loại: ngập lụt, cây đổ, cháy rừng và kẹt xe. Danh sách lựa chọn trên frontend cần được đối chiếu với dữ liệu loại báo cáo mà backend chấp nhận trước khi coi tất cả các loại là hoạt động hoàn chỉnh.

### 1.2. Quyền truy cập hiện tại

Frontend đang yêu cầu đăng nhập để vào dashboard, bản đồ, thời tiết, báo cáo và hồ sơ cá nhân. Các trang đăng nhập, đăng ký và quên mật khẩu được truy cập công khai.

### 1.3. Những phần chưa nên coi là đã hoàn thiện

- Luồng quản lý, xác minh và theo dõi báo cáo sau khi gửi.
- Luồng hiển thị báo cáo cộng đồng thành lớp sự cố trên bản đồ.
- Cảnh báo cá nhân theo khu vực quan tâm.
- Dự đoán rủi ro bằng mô hình ML đã được đánh giá độ chính xác.
- Đồng bộ dữ liệu trực tiếp từ trạm quan trắc theo thời gian thực.
- Quy trình nhập bổ sung dữ liệu có xem trước, kiểm tra lỗi và quản lý phiên bản.

## 2. Vấn đề cần giải quyết

### 2.1. Sản phẩm có nhiều mảng nhưng thiếu một luồng hoàn chỉnh

Các phần thời tiết, nông nghiệp, thiệt hại thiên tai, bản đồ và báo cáo hiện tương đối tách rời. Người dùng có thể xem dữ liệu hoặc gửi thông tin, nhưng chưa có luồng rõ ràng để biết báo cáo của mình được xác minh và giải quyết ra sao.

Mục tiêu phát triển tiếp theo cần gắn các thành phần này với một nhu cầu cụ thể, có kết quả quan sát và đo lường được.

### 2.2. Các điểm cần sửa trong mã nguồn

| Vấn đề | Ảnh hưởng | Hướng giải quyết |
| --- | --- | --- |
| Frontend gửi báo cáo bằng JSON, ảnh ở dạng Base64; backend nhận các phần `request` và `image` qua multipart | Luồng gửi chưa khớp hợp đồng API | Thống nhất dùng `FormData`, phần JSON và file ảnh; kiểm thử trường hợp có ảnh, không ảnh và ảnh không hợp lệ |
| Thời gian bắt đầu và kết thúc sự cố cùng được gán bằng thời điểm gửi | Không mô tả đúng sự cố vẫn đang diễn ra | Cho nhập thời điểm ghi nhận; để trống thời điểm kết thúc đến khi có cập nhật |
| Report Service mới có API tạo báo cáo; enum trạng thái đã có nhưng chưa thấy API chuyển trạng thái tương ứng | Báo cáo chưa có vòng đời xử lý hoàn chỉnh | Thêm API xem danh sách, chi tiết, xác minh và lịch sử cập nhật |
| Bản đồ hiển thị các đối tượng dữ liệu, chưa thấy luồng lấy báo cáo cộng đồng | Thông tin mới gửi chưa quay lại phục vụ cộng đồng | Bổ sung lớp sự cố, bộ lọc thời gian và trạng thái xác minh |
| Dashboard dùng cố định các năm 2020–2022 và ID đối tượng | Dữ liệu mới có thể không được đưa vào thống kê đúng cách | Lấy danh sách năm, đối tượng và phạm vi dữ liệu từ backend |
| Trang thời tiết tải nhiều nguồn cùng lúc và phụ thuộc kết quả chung | Một nguồn lỗi có thể làm mất cả phần dữ liệu vẫn dùng được | Quản lý tải và lỗi riêng cho từng khối; thêm nút thử lại |
| Nhập CSV chủ yếu phục vụ khởi tạo | Khó bổ sung và sửa dữ liệu định kỳ | Xây dựng quy trình nhập bổ sung có kiểm tra trùng và báo lỗi từng dòng |
| Cấu hình chạy chưa đồng nhất với image có sẵn | Tốn công xử lý khi khởi động môi trường | Chuẩn hóa biến môi trường, phiên bản image, volume và lệnh khởi động |

### 2.3. Hiệu năng gửi báo cáo

Báo cáo dự án ghi nhận thời gian gửi báo cáo trung bình khoảng 8,6 giây, tối đa khoảng 29,4 giây. Đây là số liệu trong tài liệu, chưa được đo lại trong lần chạy local.

Mã nguồn hiện thực hiện upload ảnh trong phương thức tạo báo cáo có transaction. Cần đo riêng thời gian upload, lưu database và chờ kết nối trước khi kết luận nguyên nhân. Hướng cải thiện gồm nén ảnh, giới hạn thời gian gọi dịch vụ ngoài và tách tác vụ upload khỏi transaction dài.

Nếu chuyển sang xử lý nền, giao diện cần phân biệt “đã tiếp nhận” với “đã xử lý thành công”; tác vụ phải có lưu bền vững, thử lại và hiển thị lỗi khi không hoàn tất.

## 3. Định hướng sản phẩm đề xuất

### 3.1. Chức năng trung tâm

**Giúp người dân Đà Nẵng theo dõi và báo cáo điểm ngập, đồng thời biết thông tin đó được xác minh và cập nhật đến đâu.**

Luồng sử dụng mục tiêu:

```text
Xem khu vực
    → Kiểm tra các điểm ngập đã có
    → Gửi báo cáo mới hoặc bổ sung thông tin
    → Xác minh
    → Hiển thị cho cộng đồng
    → Cập nhật diễn biến
    → Ghi nhận hết ngập
```

### 3.2. Vai trò của các phần hiện có

| Thành phần | Vai trò sau khi tập trung phạm vi |
| --- | --- |
| Bản đồ | Màn hình chính để xem sự cố, thời điểm cập nhật và mức độ xác minh |
| Báo cáo | Hành động chính, truy cập ngay từ vị trí đang chọn trên bản đồ |
| Thời tiết | Thông tin bổ trợ cho khu vực đang xem |
| Nhà trú bão, trạm đo mưa | Các lớp dữ liệu tham khảo trên bản đồ |
| Dashboard | Công cụ tổng hợp cho người quản lý |
| Khí hậu lịch sử và nông nghiệp | Đặt trong mục “Dữ liệu và thống kê”, phục vụ tra cứu và nghiên cứu |
| Tài khoản | Dùng khi gửi và quản lý báo cáo; đề xuất cho khách xem thông tin công khai |

Không cần xóa các phần đã có. Nên điều chỉnh mức độ ưu tiên trong điều hướng và đầu tư phát triển để luồng chính trở nên rõ ràng.

## 4. Chức năng nên bổ sung và cải tiến

### 4.1. Ưu tiên đầu tiên: Hoàn thiện vòng đời báo cáo ngập

| Chức năng | Nội dung | Kết quả mong muốn |
| --- | --- | --- |
| Báo cáo của tôi | Danh sách đã gửi, trạng thái, phản hồi và chi tiết | Người gửi biết kết quả sau khi báo cáo |
| Trang chi tiết sự cố | Vị trí, ảnh, mức ngập, thời điểm ghi nhận, lần cập nhật và lịch sử | Người xem đánh giá được độ mới và căn cứ của thông tin |
| Màn hình xác minh | Duyệt, từ chối có lý do, ghi chú và lưu người thực hiện | Có trách nhiệm và dấu vết xử lý rõ ràng |
| Lớp sự cố trên bản đồ | Hiển thị điểm ngập, bộ lọc thời gian, mức ngập và xác minh | Báo cáo được sử dụng để phục vụ cộng đồng |
| Ghi nhận hết ngập | Cập nhật tình trạng và thời điểm; giữ lại lịch sử | Tránh dữ liệu cũ tiếp tục hiển thị như sự cố đang diễn ra |

Nên tách hai chiều trạng thái:

- **Xác minh thông tin:** chờ xác minh, đã xác minh, bị từ chối.
- **Diễn biến sự cố:** đang diễn ra, đã kết thúc hoặc chưa rõ.

“Đã xác minh” không đồng nghĩa với “đã hết ngập”. Một sự cố có thể được xác minh chính xác và vẫn đang diễn ra.

### 4.2. Ưu tiên tiếp theo: Tăng chất lượng thông tin

- Gợi ý các sự cố gần vị trí đang chọn để hạn chế báo cáo trùng.
- Cho người dân bổ sung ảnh hoặc xác nhận tình trạng mới vào cùng một sự cố.
- Cho người quản lý gộp nhiều báo cáo liên quan; giữ liên kết với các báo cáo gốc.
- Hiển thị nguồn dữ liệu, thời điểm quan sát, thời điểm cập nhật và trạng thái xác minh.
- Đánh dấu thông tin quá cũ và đề nghị kiểm tra lại thay vì tự động coi là còn đúng.
- Phân biệt điểm có nguy cơ trong dữ liệu lịch sử với điểm được báo cáo đang ngập.

### 4.3. Cải thiện trải nghiệm trên điện thoại

- Có nút lấy vị trí hiện tại và cho phép chỉnh lại vị trí trước khi gửi.
- Giảm biểu mẫu ban đầu xuống các trường thực sự cần thiết: vị trí, mức ngập, thời điểm và ảnh hoặc mô tả.
- Cho chọn mức ngập bằng nhãn dễ hiểu; ghi rõ độ sâu là ước tính của người báo cáo.
- Nén ảnh, xem trước và thông báo tiến trình gửi.
- Lưu bản nháp khi mất mạng hoặc gửi thất bại.
- Chống tạo báo cáo trùng khi người dùng bấm gửi lại.
- Giữ thông báo lỗi ngay trong biểu mẫu, giải thích trường cần sửa.

### 4.4. Quản lý dữ liệu và vận hành

- Trang nhập CSV có xem trước và ánh xạ cột.
- Kiểm tra kiểu dữ liệu, tọa độ, đơn vị, thời gian và bản ghi trùng trước khi lưu.
- Tải danh sách dòng lỗi để người nhập sửa.
- Lưu nguồn dữ liệu, thời điểm nhập và lịch sử các lần cập nhật.
- Chuẩn hóa cấu hình để khởi động toàn bộ dự án bằng một lệnh.
- Thống nhất đường dẫn API và cách frontend kết nối với backend.
- Có kiểm tra trạng thái dịch vụ, nhật ký lỗi và cơ chế sao lưu dữ liệu.
- Bảo vệ thao tác xác minh và cập nhật trạng thái bằng phân quyền ở backend.

### 4.5. Chức năng mở rộng sau khi luồng chính ổn định

| Chức năng | Điều kiện trước khi phát triển |
| --- | --- |
| Theo dõi khu vực và nhận thông báo | Có dữ liệu sự cố đủ mới, quy tắc chọn người nhận và kiểm soát thông báo trùng |
| Thống kê điểm ngập tái diễn | Có lịch sử sự cố, tọa độ và cách gộp sự cố nhất quán |
| Phân tích quan hệ giữa mưa và ngập | Có dữ liệu mưa và sự cố được căn chỉnh theo vị trí, thời gian |
| Dự đoán rủi ro | Có tập dữ liệu phù hợp, tiêu chí đánh giá và cách giải thích giới hạn kết quả |
| Chỉ đường tránh ngập | Có dữ liệu đường, mức ngập và cập nhật đủ tin cậy để đánh giá tuyến đường |

AI dự đoán và chỉ đường tránh ngập chưa được ưu tiên cho bản nâng cấp đầu tiên. Nguồn lực trước mắt nên dùng để hoàn thiện chất lượng báo cáo và khả năng cập nhật tình trạng thực tế.

## 5. Lộ trình triển khai

### Giai đoạn 1: Sửa nền tảng và luồng gửi

**Công việc:**

- Khớp hợp đồng API gửi báo cáo và file ảnh.
- Chuẩn hóa danh sách loại sự cố giữa frontend và backend.
- Sửa thời gian bắt đầu, kết thúc và kiểm tra tọa độ.
- Bỏ các năm và ID cố định khỏi logic giao diện.
- Chuẩn hóa cấu hình chạy local.

**Tiêu chí hoàn thành:**

- Gửi được báo cáo ngập có ảnh và không có ảnh.
- Báo cáo lưu đúng vị trí, thời gian và loại sự cố.
- Lỗi đầu vào được giải thích trên giao diện.
- Khởi động lại môi trường theo hướng dẫn mà không cần sửa thủ công cấu hình.

### Giai đoạn 2: Hoàn thiện vòng đời sự cố

**Công việc:**

- Thêm danh sách báo cáo của tôi và trang chi tiết.
- Thêm quyền và màn hình xác minh.
- Hiển thị sự cố trên bản đồ.
- Cập nhật tình trạng hết ngập và lưu lịch sử.

**Tiêu chí hoàn thành:**

- Người dân gửi và xem lại báo cáo được.
- Người có quyền xác minh được; người không có quyền không thực hiện được thao tác này.
- Người xem bản đồ phân biệt được trạng thái xác minh và diễn biến sự cố.
- Sự cố kết thúc không tiếp tục xuất hiện như điểm đang ngập trong bộ lọc hiện tại.

### Giai đoạn 3: Cải thiện tốc độ và chất lượng

**Công việc:**

- Tối ưu biểu mẫu trên điện thoại và xử lý ảnh.
- Bổ sung bản nháp, thử lại và chống gửi trùng.
- Gợi ý sự cố gần vị trí, bổ sung thông tin và gộp báo cáo.
- Đo hiệu năng trước và sau thay đổi.

**Tiêu chí hoàn thành:**

- Gửi thất bại không làm mất nội dung đã nhập.
- Thử lại không tạo bản ghi trùng ngoài ý muốn.
- Có số liệu xác định bước gây chậm và mức cải thiện.
- Hiển thị rõ các báo cáo thiếu cập nhật hoặc chưa được xác minh.

### Giai đoạn 4: Mở rộng theo dữ liệu sử dụng

Triển khai theo dõi khu vực, thông báo và thống kê điểm ngập tái diễn khi có nhu cầu thực tế. Chỉ đầu tư dự đoán sau khi đánh giá được chất lượng dữ liệu đầu vào và xác định cách đo kết quả.

## 6. Chỉ số đánh giá

| Chỉ số | Mục đích |
| --- | --- |
| Thời gian người dùng hoàn thành biểu mẫu | Đánh giá mức thuận tiện khi báo cáo |
| Tỷ lệ gửi thành công | Xác định độ ổn định của luồng chính |
| Độ trễ API theo p50 và p95, tách có ảnh và không ảnh | Theo dõi cả trường hợp thông thường và các yêu cầu chậm |
| Thời gian từ gửi đến xác minh | Đánh giá quy trình tiếp nhận và xử lý |
| Tỷ lệ báo cáo trùng, bị từ chối | Đánh giá chất lượng thông tin đầu vào |
| Tỷ lệ sự cố có cập nhật quá cũ | Đánh giá độ mới của bản đồ |
| Tỷ lệ sự cố kết thúc có thời điểm và căn cứ cập nhật | Đánh giá mức hoàn chỉnh của vòng đời sự cố |

Chưa đặt các ngưỡng cam kết khi chưa đo đường cơ sở. Cần thu thập số liệu ban đầu, sau đó chọn mục tiêu phù hợp với quy mô và nguồn lực của nhóm.

## 7. Phạm vi bản nâng cấp đầu tiên

Mục tiêu đề xuất: **Một người gửi được điểm ngập, người quản lý xác minh được, người khác nhìn thấy trên bản đồ và biết khi nào điểm đó hết ngập.**

Phạm vi này tận dụng bản đồ, tài khoản, database, upload ảnh và kiến trúc dịch vụ hiện có. Nó cũng tạo một kịch bản demo có đầu vào, quá trình xử lý và kết quả rõ ràng để nhóm kiểm thử và đánh giá.

## 8. Kế hoạch AI phân tích bất thường dữ liệu khí hậu

**Trạng thái: đề xuất trong kế hoạch, chưa triển khai vào sản phẩm.** Phạm vi AI được chọn là phân tích bất thường trong dữ liệu khí hậu lịch sử. Chức năng này giúp người dùng tìm các mốc cần kiểm tra và tìm hiểu nguyên nhân; kết quả không được diễn giải thành dự báo ngập hoặc cảnh báo thiên tai.

### 8.1. Mục tiêu và người sử dụng

- Hỗ trợ cán bộ và người nghiên cứu tìm những tháng có lượng mưa, nhiệt độ, độ ẩm hoặc số giờ nắng khác biệt so với lịch sử.
- Giảm thời gian đọc thủ công chuỗi dữ liệu dài.
- Hỗ trợ kiểm tra chất lượng dữ liệu: một điểm bất thường có thể do hiện tượng khí hậu, sai đơn vị, sai nhập liệu hoặc lỗi quan trắc.
- Tạo kết quả có căn cứ, truy lại được chỉ số, vị trí, khoảng thời gian và dữ liệu dùng để so sánh.

### 8.2. Phạm vi bản đầu tiên

| Nội dung | Đề xuất |
| --- | --- |
| Đầu vào | Chuỗi thời gian của một chỉ số khí hậu tại một đối tượng hoặc khu vực, kèm đơn vị và nguồn dữ liệu |
| Chỉ số ưu tiên | Nhiệt độ, lượng mưa, độ ẩm, số giờ nắng; chỉ phân tích các chuỗi đã kiểm tra đơn vị |
| Độ phân giải | Theo tháng; không trộn dữ liệu ngày, tháng và năm trong cùng một lần phân tích |
| Thao tác | Người dùng chọn chỉ số, khu vực và giai đoạn rồi yêu cầu phân tích |
| Đầu ra | Các mốc cần kiểm tra, giá trị quan sát, mức tham chiếu cùng mùa, độ lệch, biểu đồ và thông tin chất lượng dữ liệu |
| Giới hạn | Phân tích hồi cứu; chưa dự báo giá trị tương lai và chưa kết luận nguyên nhân |

### 8.3. Chuẩn bị dữ liệu trước khi dùng AI

1. Đối chiếu giá trị, đơn vị và hệ số quy đổi với dữ liệu gốc. Khi đọc API local, đơn vị lượng mưa đang trả về nhãn giờ; cần giải quyết điểm này trước khi diễn giải độ lớn.
2. Chuẩn hóa thời gian, xử lý thứ tự quan sát, bản ghi trùng và giá trị không hợp lệ.
3. Quy định cách tổng hợp theo chỉ số: lượng mưa có thể là tổng tháng, nhiệt độ có thể là trung bình tháng; phải kiểm tra ý nghĩa của nguồn trước khi áp dụng.
4. Thống kê dữ liệu thiếu và mức bao phủ từng tháng trong năm. Không mặc định điền dữ liệu thiếu bằng 0.
5. Đặt điều kiện tối thiểu để phân tích. Mốc thử nghiệm đề xuất là 60 quan sát tháng và có dữ liệu cho đủ 12 tháng trong năm; cần điều chỉnh sau khi khảo sát dữ liệu thực tế.
6. Giữ dữ liệu gốc và ghi lại các bước làm sạch để có thể tái lập kết quả.

Nếu chưa đủ dữ liệu hoặc đơn vị chưa được xác nhận, giao diện cần giải thích nguyên nhân và yêu cầu bổ sung hoặc kiểm tra nguồn.

### 8.4. Phương pháp đề xuất

Thử nghiệm **Isolation Forest**, một mô hình học máy không giám sát để sàng lọc điểm khác biệt trong dữ liệu. Chưa chốt mô hình trước khi đánh giá trên dữ liệu dự án.

Quy trình thử nghiệm:

1. Xây dựng đường cơ sở đơn giản bằng trung vị và độ phân tán bền vững của cùng tháng qua các năm.
2. Điều chỉnh ảnh hưởng mùa vụ trước khi đưa đặc trưng vào mô hình, tránh coi mùa mưa là bất thường chỉ vì lượng mưa cao hơn mùa khô.
3. Huấn luyện mô hình trên phần dữ liệu tham chiếu và tính điểm cho phần dữ liệu cần kiểm tra.
4. So sánh với đường cơ sở để xác định AI có cải thiện kết quả hay không.
5. Chọn ngưỡng dựa trên đánh giá và số lượng cảnh báo giả có thể chấp nhận; tránh ép một tỷ lệ bất thường cố định khi chưa có căn cứ.

Khi đánh giá khả năng phát hiện trên dữ liệu mới, phải chia tập theo thời gian và chỉ dùng dữ liệu quá khứ để tính đặc trưng, mùa vụ và ngưỡng. Nếu dùng toàn bộ lịch sử để phân tích hồi cứu, cần ghi rõ phương thức này và không báo cáo kết quả như năng lực dự báo tương lai.

Điểm mô hình và độ lệch thống kê không phải xác suất thiên tai hoặc phần trăm độ tin cậy.

Tài liệu phương pháp: [Isolation Forest trong scikit-learn](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html).

### 8.5. Trải nghiệm trên giao diện

Đề xuất đặt mục “AI phân tích bất thường khí hậu” trong phần Dữ liệu và thống kê, gần biểu đồ lịch sử để giữ luồng bản đồ và báo cáo ngập tập trung.

- Có bộ chọn khu vực, chỉ số và giai đoạn; không ghi cố định ID đối tượng hoặc năm.
- Biểu đồ hiển thị chuỗi quan sát, mức tham chiếu và các điểm cần kiểm tra.
- Bảng chi tiết gồm thời gian, giá trị, đơn vị, mức tham chiếu, độ lệch và diễn giải.
- Hiển thị nguồn, ngày cập nhật dữ liệu, phạm vi tham chiếu và phiên bản mô hình.
- Có trạng thái đang tải, không đủ dữ liệu, lỗi dịch vụ và không phát hiện điểm vượt ngưỡng.
- Không dùng nhãn “nguy hiểm” hoặc “an toàn” cho kết quả bất thường thống kê.
- Cho người có chuyên môn đánh dấu kết quả: đáng chú ý, lỗi dữ liệu hoặc chưa xác định; lưu phản hồi để đánh giá mô hình.

Ví dụ cách diễn giải: “Giá trị tháng này cao hơn trung vị cùng tháng trong giai đoạn tham chiếu. Cần kiểm tra dữ liệu gốc và bối cảnh thực tế.” Hệ thống không tự kết luận có ngập lụt từ kết quả này.

### 8.6. Tích hợp kỹ thuật dự kiến

- Tận dụng dữ liệu lịch sử từ Search Service; AI không tự sửa dữ liệu quan trắc.
- Cân nhắc một dịch vụ Python riêng cho tiền xử lý và mô hình; frontend gọi qua API được cấu hình thống nhất.
- Hợp đồng API nhận đối tượng, chỉ số và phạm vi thời gian; trả kết quả cùng thông tin nguồn, phương pháp, chất lượng dữ liệu và phiên bản.
- Giới hạn kích thước chuỗi, thời gian xử lý và số tác vụ đồng thời.
- Có thể cache kết quả theo phiên bản dữ liệu và cấu hình mô hình; dữ liệu cập nhật phải làm mất hiệu lực kết quả cũ.
- Đóng gói dịch vụ và hướng dẫn chạy cùng hệ thống sau khi phương pháp được đánh giá.

Đây là thiết kế dự kiến, chưa phải API hoặc dịch vụ đang hoạt động.

### 8.7. Kiểm thử và đánh giá

| Tình huống | Điều cần chứng minh |
| --- | --- |
| Chuỗi có mùa vụ bình thường | Mô hình hạn chế đánh dấu sai các đỉnh theo mùa |
| Chuỗi được chèn điểm đột biến có kiểm soát | Có khả năng phát hiện điểm khác biệt đã biết |
| Chuỗi hằng hoặc biến động nhỏ | Không tạo bất thường chỉ để đủ tỷ lệ |
| Thiếu dữ liệu, trùng tháng, sai đơn vị | Từ chối hoặc xử lý theo quy tắc rõ ràng, không âm thầm tạo kết quả |
| Chia tập theo thời gian | Không sử dụng thông tin tương lai trong quá trình đánh giá dữ liệu mới |
| Mẫu dữ liệu thật được người có chuyên môn nhận xét | Đánh giá mức hữu ích và cảnh báo giả trong điều kiện thực tế |
| AI bị lỗi hoặc quá hạn | Các chức năng xem dữ liệu, bản đồ và báo cáo vẫn sử dụng được |

Theo dõi precision, recall khi có nhãn đáng tin cậy; nếu chưa có nhãn, báo cáo kết quả kiểm tra tổng hợp và phản hồi chuyên môn, không công bố độ chính xác tùy ý. Đo thêm thời gian xử lý và số điểm cần kiểm tra trên mỗi chuỗi.

### 8.8. Thứ tự triển khai trong kế hoạch chung

1. Khảo sát chất lượng chuỗi khí hậu và sửa các vấn đề về đơn vị, thời gian.
2. Làm đường cơ sở thống kê và chuẩn bị tập đánh giá.
3. Thử nghiệm Isolation Forest, so sánh và chọn phương pháp phù hợp.
4. Đặc tả API và giao diện kết quả có giải thích.
5. Tích hợp bản thử nghiệm, thu phản hồi và điều chỉnh ngưỡng.

Có thể khảo sát dữ liệu AI trong khi hoàn thiện chức năng báo cáo ngập. Việc tích hợp AI vào sản phẩm được xếp sau các bước sửa nền tảng và hoàn thiện vòng đời báo cáo ở Giai đoạn 1–2. Dự đoán ngập là hướng riêng, chưa nằm trong phạm vi AI phân tích bất thường này.

## 9. Mã nguồn tham chiếu

Các đường dẫn dưới đây tính từ thư mục gốc dự án `E:\Danang_EcoWarning\DaNang_EcoWarning`:

- `frontend/Danang_EcoWarning_FE/src/App.jsx`: điều hướng và yêu cầu đăng nhập.
- `frontend/Danang_EcoWarning_FE/src/pages/DashboardPage/DashboardPage.jsx`: thống kê, năm và ID đối tượng cố định.
- `frontend/Danang_EcoWarning_FE/src/pages/WeatherPage/WeatherPage.jsx`: tải thời tiết, dự báo và chất lượng không khí.
- `frontend/Danang_EcoWarning_FE/src/pages/Map/MapPage.jsx`: bố cục bản đồ và chọn đối tượng.
- `frontend/Danang_EcoWarning_FE/src/components/map/AssetSelector.jsx`: các nhóm dữ liệu trên bản đồ.
- `frontend/Danang_EcoWarning_FE/src/components/map/ProfilePanel.jsx`: thông tin chi tiết đối tượng.
- `frontend/Danang_EcoWarning_FE/src/pages/ReportPage/ReportPage.jsx`: biểu mẫu, ảnh và thời gian sự cố.
- `frontend/Danang_EcoWarning_FE/src/services/api.js`: lời gọi API dữ liệu và gửi báo cáo.
- `backend/citizen-report-service/src/main/java/com/example/citizen_report_service/controller/ReportController.java`: API nhận multipart.
- `backend/citizen-report-service/src/main/java/com/example/citizen_report_service/service/impl/ReportServiceImpl.java`: upload ảnh, tạo và lưu báo cáo.
- `backend/citizen-report-service/src/main/java/com/example/citizen_report_service/domain/entity/ReportStatus.java`: trạng thái xác minh hiện có.
- `backend/collector-data-service/src/main/java/com/example/collector_data_service/utils/DatabaseInitializer.java`: khởi tạo dữ liệu CSV.
