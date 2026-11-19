# Bright coastal UI — kết quả và lịch sử phát hành

Thực hiện trong lượt làm việc ngày **18/11/2026**. Người dùng chọn: **xanh dương + xanh ngọc + vàng nắng**. Nhánh: `feat/bright-coastal-ui`.

## Thay đổi

- Bỏ nền xám xanh đục và khối thời tiết tối; dùng nền gần trắng, xanh trời và xanh ngọc sáng với chữ đậm.
- Xanh dương dành cho thao tác và trạng thái điều hướng đang chọn. Vàng nắng có trong nhận diện, mặt trời và cảnh báo có nhãn; không thêm chỉ số rủi ro giả.
- Sidebar giữ cơ chế thu/mở đúng bằng chuột và bàn phím. Bảng báo cáo bản đồ cao theo nội dung, chỉ cuộn khi cần.
- Dự báo dùng lưới 4 cột ở tablet, 2 cột ở điện thoại; không để text nằm sát mép vùng cuộn. Màu không khí đổi theo AQI thay vì luôn dùng nền xanh khi chỉ số kém.
- Đầu bộ số liệu, đơn vị, bảng đối chiếu, biểu mẫu, tài khoản và màn AI dùng cùng token. JSON dùng font monospace đúng ngữ cảnh nhập payload.
- CSS theme tách theo vai trò màn hình, có một entry point trong main.jsx. Không thay thuật toán, dữ liệu nguồn hoặc API.

## Bằng chứng kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| Lint workspace/App và build production | Qua; vẫn có cảnh báo chunk bản đồ lớn của Vite |
| Data model | 3 test qua |
| Hồi quy 14 route ở desktop/tablet/mobile | 138 assertion qua; fixture đã xóa |
| Palette, hover và tương phản trên trình duyệt | 39 assertion qua |
| Sidebar, chuyển động, focus, loading và menu cảm ứng | 27 assertion qua |
| AI | Hai mẫu dataset trả đúng nhãn ở 1440/390px |
| taste-skill inspector, trang thời tiết sau sửa | 0 FAIL / 0 WARN |
| impeccable detector | Một cảnh báo gạch chân tab; tab có border-radius:0, giữ underline để nhận biết lựa chọn |

Tương phản đo trên render: nút chính 5,43:1; chữ nguồn trên nền thời tiết 6,02:1; text input 13,13:1; viền input 3,69:1. Xem [JSON](bright-ui-evidence/contrast-and-layout.json), [hồi quy](bright-ui-evidence/workspace-check.json), [điều hướng](bright-ui-evidence/navigation-check.json), [taste report](bright-ui-evidence/taste-report.json), [impeccable report](bright-ui-evidence/impeccable-report.json).

Skill được dùng từ E:/mnm haui/taste-skill/skills/taste-skill và E:/mnm haui/impeccable/.agents/skills/impeccable. Đã đọc colorize/craft-floor và áp hướng Operate; kiểm tra ảnh thật rồi sửa lỗi forecast sát mép, không chỉ dựa vào detector. Đây là kiểm tra local, không phải nghiên cứu khả dụng độc lập hoặc đo FPS trên máy người dùng.

Ảnh: [trước](bright-ui-evidence/weather-before.jpg), [sau](bright-ui-evidence/weather-after.jpg), [điện thoại](bright-ui-evidence/weather-mobile.jpg), [dữ liệu](bright-ui-evidence/data-after.jpg), [tài khoản](bright-ui-evidence/account-after.jpg).

## Phân bổ ngày Git theo yêu cầu

**Các ngày Git dưới đây được sắp xếp lại theo yêu cầu người dùng, không phải bằng chứng công việc đã diễn ra trong 6 ngày.** Công việc và kiểm tra thực hiện trong lượt 18/11/2026. Không viết lại lịch sử các commit đã tồn tại. Mỗi commit mới cũng ghi chú chính sách này trong body. Hai mốc mỗi ngày: 09:30 và 16:30, múi giờ +07:00. Push thực hiện lần lượt trong phiên hiện tại.

| Commit mới | Ngày Git | Nội dung có thay đổi thực tế |
| --- | --- | --- |
| 1 | 13/11 | Token màu và điểm vào theme |
| 2 | 13/11 | Component/control và các trạng thái chung |
| 3 | 14/11 | Sidebar/điều hướng |
| 4 | 14/11 | Bố cục và overlay bản đồ |
| 5 | 15/11 | Tổng quan thời tiết, AQI và dự báo responsive |
| 6 | 15/11 | Trang dữ liệu, biểu đồ và bảng đối chiếu |
| 7 | 16/11 | Biểu mẫu và danh sách cộng đồng |
| 8 | 16/11 | Tài khoản/hồ sơ |
| 9 | 17/11 | Bố cục màn thử nghiệm AI |
| 10 | 17/11 | Responsive chung, logo và banner |
| 11 | 18/11 | Kiểm tra palette và bằng chứng |
| 12 | 18/11 | Design system và tài liệu phát hành |
