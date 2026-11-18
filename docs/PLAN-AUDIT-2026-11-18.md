# Đối chiếu kế hoạch và tích hợp — 18/11/2026

## Nguồn code và quyết định tích hợp

Nhánh đích: feat/ai-fullstack-integration, xuất phát từ bản giao diện/dữ liệu 7281e38. Fetch remote delivery và kéo 5 commit AI từ delivery/Sontv/feat/integration_model bằng cherry-pick, giữ tác giả gốc và giữ các sửa đổi FE/BE mới hơn trên nhánh hiện tại. Không thay toàn bộ cây source bằng nhánh AI cũ.

Nhánh delivery/feat/safe-routing-directions có thay đổi Goong → TrackAsia và tìm đường thử nghiệm. Chưa gộp nhánh đó vào bản này vì nó là thay đổi sản phẩm riêng, trong khi kế hoạch đặt điều kiện về dữ liệu đường/ngập đã xác minh trước khi công bố tuyến an toàn.

## Đối chiếu

| Phần kế hoạch | Trạng thái thực tế |
| --- | --- |
| Luồng tiếp nhận/xem/xác minh/cập nhật/kết thúc/gộp báo cáo | Đã có từ phiên bản trước; giữ nguyên, chạy lại 28 HTTP checks |
| Phân quyền và mục đích token | Giữ Report Service; sửa Search Service để đọc role từ JWT đã ký và chỉ nhận access token cho API bảo vệ |
| Mobile, định vị, nháp, nén ảnh, retry/idempotency | Đã có; không viết lại trong lượt tích hợp này |
| Dữ liệu, catalog động, xung đột/đơn vị, CSV preview/commit/lịch sử | Đã có, giữ giá trị gốc và nhãn xung đột |
| Theo dõi khu vực/thông báo trong app/nhóm ghi nhận ngập | Đã có; không chuyển thành email/push khi chưa cấu hình kênh |
| AI model vừa được nhóm push | Đã kéo model, FastAPI, Docker, metadata và tests; không huấn luyện lại hoặc thay artifact |
| FE → BE → AI | Bổ sung Search Service proxy, timeout 2s/15s, kiểm tra payload, quyền quản lý, lỗi 422/503; FE /ai-flood có mẫu dataset và hiển thị kết quả/điền khuyết/phiên bản |
| AI chạy cùng ứng dụng | Script start bật profile ai; compose cấu hình FLOOD_AI_BASE_URL nội bộ, không gọi Python trực tiếp từ FE |
| Phân tích bất thường khí hậu trong §8 | Bổ sung API /metric/anomalies và phần phân tích trên trang dữ liệu. Dùng trung vị/MAD theo mùa, tham chiếu loại chính điểm đang xét; nêu rõ đây là thống kê hồi cứu |
| Điều kiện dữ liệu phân tích | Bắt buộc người dùng đối chiếu đơn vị; kiểm tra tên/đơn vị khí hậu phù hợp; >=60 quan sát tháng, đủ 12 tháng, >=5 quan sát mỗi tháng; không trộn nhiều quan sát trong tháng; không điền thiếu; bỏ điểm xung đột |
| Giải thích/tái lập phân tích | Trả phương pháp, ngưỡng 3.5, số quan sát, số mốc xung đột bị loại, giá trị/median/độ lệch/điểm của từng mốc; áp cùng bộ lọc thời gian đang chọn |
| Công nghệ, cách cài thư viện và VS Code | File local E:/mnm haui/HUONG-DAN-EcoWarning-VSCode.md; recommendation extensions trong .vscode/extensions.json local |

## Điều kiện chưa thể tự hoàn tất bằng code

- Model ngập có metadata validated_for_da_nang=false, training_crs/feature_units/rainfall_accumulation_period chưa có. Dataset mẫu có X/Y khác hệ kinh/vĩ độ Đà Nẵng. Không tự ghép lat/lon hoặc mưa OpenWeather vào 9 đặc trưng. Cần nhóm AI cung cấp metadata, dữ liệu GIS/quan trắc tương ứng và đánh giá độc lập cho địa phương trước khi nối tự động lên bản đồ.
- Phân tích khí hậu là quy tắc thống kê cần đối chiếu kết quả với chuyên môn; không gọi đó là dự báo thiên tai hay kết luận nguyên nhân. Dữ liệu có nhãn đơn vị không phù hợp bị từ chối thay vì tự quy đổi.
- Chưa có dữ liệu mưa/ngập/đường được kiểm chứng để hoàn tất phân tích quan hệ nhân quả hoặc chỉ đường an toàn. Các mục này là mở rộng có điều kiện trong kế hoạch.
- OTP/Cloudinary thực tế vẫn phụ thuộc tài khoản và dịch vụ ngoài; không báo đã kiểm chứng nếu chỉ test API local. Chưa có baseline tải/p95 để công bố tăng hiệu năng, chưa triển khai worker upload nền vì cần cơ chế lưu bền/thử lại riêng.

## Kiểm chứng trong lượt này

- AI: 28 pytest qua, một cảnh báo deprecation ở dependency testclient.
- Java Search Service: 8 test qua (unit/quality và hai controller mới); package thành công. Không coi đây là toàn bộ ApplicationTests Java đã qua.
- FE: production build và lint workspace/App qua; ba test dataModel qua.
- Tích hợp HTTP: hai mẫu No_Flood/Flood qua FE proxy → BE → AI; model info, payload sai, quyền thường và OTP token: tổng 6 checks qua. 28 checks luồng cũ chạy lại qua, fixture được xóa.
- Khí hậu: API trả completed cho chuỗi nhiệt độ đủ mẫu, 422 khi không xác nhận đơn vị, insufficient_data khi thu hẹp giai đoạn.
- Trình duyệt: /ai-flood ở 1440 và 390px, chạy cả hai mẫu thật, kiểm tra đúng nhãn trả về và không tràn ngang. Dữ liệu tài khoản thử nghiệm chỉ tồn tại trong browser context với token kiểm thử local.
- CI bổ sung test các controller Search Service; chưa khẳng định workflow GitHub đã qua trước khi có kết quả remote.

Mẫu AI là dataset của nhóm, không phải dữ liệu quan trắc tại Đà Nẵng. Mọi kết quả được trình bày dưới dạng thử nghiệm. Không xóa hay sửa ngầm bản ghi lịch sử.
- Bổ sung kiểm tra trình duyệt cho phân tích khí hậu: checkbox xác nhận, gọi API, kết quả, các điểm đánh dấu trên biểu đồ và xuất JSON (không tải file vào Downloads khi kiểm thử). JSON chứa phương pháp, ngưỡng, bộ lọc và các mốc để đối chiếu/tái lập.
