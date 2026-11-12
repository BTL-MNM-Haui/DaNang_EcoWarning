# Đề xuất giao diện EcoWarning

## Hướng đề xuất: bản đồ đô thị ven biển

Tập trung vào việc tìm sự cố và gửi cập nhật. Xanh biển gợi địa điểm ven biển; xanh ngọc gắn với môi trường. Màu vàng/đỏ mang nghĩa trạng thái cần chú ý, không rải thành màu trang trí trên mọi khối.

## Đã chỉnh trong lượt này

- Desktop: rail 76px, mở thành 256px khi hover hoặc có focus bàn phím. Chiếm một cột riêng trong grid, không che nội dung. Escape đưa focus về nội dung.
- Thiết bị cảm ứng trên 850px giữ nhãn điều hướng; dưới 850px dùng nút menu, chọn trang sẽ đóng menu.
- Bản đồ toàn vùng làm việc với danh sách nổi 330px từ 1280px; desktop hẹp dùng hai cột. Điện thoại có nút Bản đồ / Danh sách.
- Giữ tìm kiếm, diễn biến và xác minh luôn hiện. Thời gian/độ ngập ở nhóm “Bộ lọc thêm”, có chỉ báo khi đang áp dụng.
- Danh sách rỗng giải thích tình trạng và có hành động mở rộng tìm kiếm/gửi báo cáo. Chỉ hiện phân trang khi có hơn 100 kết quả.
- Tăng nhãn bộ lọc lên 13px, thống nhất khoảng cách và bo góc. Một số biểu tượng chức năng dùng màu nhận diện nhẹ.

## Các hướng style để lựa chọn

| Hướng | Đặc điểm | Phù hợp |
| --- | --- | --- |
| Đô thị ven biển — đề xuất | Nền sáng, xanh biển/xanh ngọc, bản đồ lớn, chữ rõ, panel gọn | Sản phẩm hiện tại và người dùng cộng đồng |
| Bản đồ địa hình | Nền trắng ngà nhẹ, xanh rêu/xanh nước, đường nét lấy cảm hứng từ bản đồ | Muốn bản sắc môi trường rõ hơn; cần đổi đồng bộ nhận diện |
| Trung tâm điều hành | Mật độ dữ liệu cao hơn, bảng và hàng dữ liệu, màu trạng thái nổi bật | Màn hình quản lý; không nên áp cùng mật độ cho người dân |

## Logo và nhận diện

Logo hiện tại dùng ghim vị trí và sóng. Giữ biểu tượng này để người dùng nhận ra sản phẩm, đơn giản hóa chi tiết khi dùng ở kích thước favicon. Wordmark đầy đủ dành cho menu mở, màn hình tài khoản và README; rail dùng biểu tượng.

Nếu thiết kế lại logo sâu hơn, đề xuất ghép nét sóng sông Hàn với đường cầu trong một ghim địa điểm. Cần thử bản một màu, nền sáng/tối và kích thước 16/24/48px trước khi chọn; tránh thêm nhiều chi tiết cảnh quan khiến icon nhỏ khó nhận ra. Đây là đề xuất, chưa thay logo bằng một mẫu chưa được chọn.

## Các bước UX tiếp theo

1. Thêm tìm địa chỉ bằng dịch vụ geocoding khi xác nhận nhà cung cấp và hạn mức. Ô hiện tại tìm nội dung báo cáo, chưa phải tìm mọi địa chỉ.
2. Màn hình quản lý có bố cục hàng đợi: chờ xác minh, xem bằng chứng, quyết định và ghi lý do.
3. Có hướng dẫn ngắn ở lần gửi báo cáo đầu tiên: vị trí, thời gian quan sát, ảnh và diễn biến. Không thêm tour dài chặn công việc.

Các mục tiếp theo là đề xuất, không phải tính năng đã hoàn thành.

## Bản thiết kế lại trên nhánh riêng

- Thời tiết: quan sát hiện tại nổi bật, chỉ số không khí riêng và dải dự báo 3 giờ; chọn ngày và mở bảng chi tiết.
- Dữ liệu: bộ chọn ở cột riêng, biểu đồ/bảng là nội dung chính.
- Không push trực tiếp main; các lượt sửa tiếp theo dùng feature branch theo yêu cầu người dùng.
## Bản cập nhật theo phản hồi về chữ và dữ liệu

Thiết kế, chữ, kích thước menu và phần dữ liệu đã được thay thế bằng hệ thống mới trong DESIGN.md. Đọc docs/SKILL-REVIEW.md để xem ảnh và bằng chứng thực tế. Chữ Be Vietnam Pro tự host thay cho Geist; sidebar mở 288px và phân biệt focus chuột/bàn phím; phần dữ liệu dùng bộ chọn rộng, biểu đồ/bảng và nhãn chất lượng từ API. Các mô tả trước phần này ghi lại hướng đề xuất ở lượt trước.
