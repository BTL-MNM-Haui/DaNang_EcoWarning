---
name: DaNang EcoWarning
description: Tra cứu dữ liệu và theo dõi báo cáo sự cố cộng đồng
colors:
  primary: "#086b91"
  ground: "#eef3f6"
  surface: "#ffffff"
  ink: "#123c4b"
  muted: "#415766"
  border: "#cbd7df"
  controlBorder: "#718694"
  chart: "#08749c"
  danger: "#a32e32"
typography:
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "6px"
  panel: "14px"
spacing:
  compact: "12px"
  normal: "16px"
  panel: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
---

# Design System: DaNang EcoWarning

## Hướng thiết kế

Không gian tra cứu công cộng lấy dữ liệu làm trọng tâm. Giữ nhận diện xanh biển/xanh ngọc; tăng khả năng đọc, độ tương phản và sự khác biệt giữa nội dung chính, thao tác, nguồn và trạng thái. Đây là hướng thay thế phần giao diện trung tính ban đầu, theo phản hồi của người dùng.

Không tạo số liệu trang trí, không dùng báo cáo chưa xác minh như cảnh báo chính thức. Không triển khai AI.

## Chữ và màu

Be Vietnam Pro 400/500/600/700 được lưu trong public/fonts, có giấy phép OFL đi kèm. Không cần kết nối Google Fonts khi chạy ứng dụng. Nội dung 16px, nhãn 15px, chú thích thường 14px, tiêu đề trang 32px/600 và 28px trên mobile. Chú giải bản đồ nhỏ hơn để không che bản đồ. Chữ logo SVG dùng Arial để asset hoạt động độc lập.

Nền #eef3f6, panel trắng, mực #123c4b, chữ phụ #415766. Hành động #086b91 và hover #07536f. Biên input #718694. Kiểm tra màu thực tế tại docs/design-evidence/contrast-check.json: chữ input 11,84:1; viền input 3,79:1; metadata 7,55:1.

Trạng thái luôn kèm chữ. Thời tiết hiện tại dùng nền #07536f, chữ trắng và chữ phụ #d5edf5. Màu của chất lượng không khí theo chỉ số API; màu không thay cho mô tả.

## Điều hướng và motion

Desktop: rail 76px, mở thành 288px khi hover hoặc khi có focus-visible từ bàn phím. Grid dành đúng chiều rộng, không mở phủ lên nội dung. Focus sau click chuột không giữ menu mở. Escape đưa focus về main. Thiết bị cảm ứng rộng giữ nhãn; dưới 851px dùng menu đóng/mở.

Grid chuyển trong 180ms với cubic-bezier(.22,1,.36,1). Reduced motion tắt chuyển động không gian. ResizeObserver của bản đồ gộp resize WebGL trong 100ms sau thay đổi bố cục; timer được hủy khi unmount. Thông báo tải bản đồ có kích thước theo nội dung, tối đa 360px, không phải một dải toàn chiều ngang.

## Bản đồ và báo cáo

Từ 1280px: bản đồ trải vùng làm việc, bảng báo cáo nổi 330px, layer/legend/ghi chú tránh bảng. Desktop hẹp dùng hai cột. Điện thoại chọn Bản đồ hoặc Danh sách. Giữ attribution của Goong.

Biểu mẫu báo cáo chia nội dung và vị trí ở desktop; mobile xếp một cột. Có hướng dẫn tiến trình, nháp, ảnh và gợi ý báo cáo gần đây; chức năng và dữ liệu nguồn được giữ. Danh sách, thông báo và theo dõi khu vực có trạng thái rỗng phù hợp với công việc của trang.

## Dữ liệu và thống kê

Tách dữ liệu lịch sử và ghi nhận ngập cộng đồng thành hai chế độ để không nhập nhằng nguồn. Bộ chọn rộng gồm khu vực, nhóm, chỉ số; thời gian trong details. Tên chỉ số đầy đủ, đơn vị và phạm vi riêng của tập đang chọn hiện ở phần kết quả.

Summary là mô tả tập dữ liệu: số bản ghi, thời gian, số điểm dùng được, số thời điểm xung đột. Biểu đồ và bảng là hai chế độ rõ ràng. Chỉ hiện cảnh báo đối chiếu khi có xung đột/lặp/thiếu. Bảng phân trang 25 dòng, có nhãn chất lượng và mã bản ghi. CSV giữ bản ghi của tập đang lọc.

Backend chuẩn hóa cách viết đơn vị, giữ unitRaw. Không đổi giá trị hoặc đoán phép quy đổi. Thời điểm khác giá trị giữ nguyên, đánh dấu CONFLICT; chuỗi xu hướng dùng null để tạo khoảng ngắt. Bản ghi cùng thời điểm cùng giá trị vẫn giữ ở bảng, chỉ tính một điểm trên biểu đồ. Zero không bị xem là thiếu.

## Tài khoản và các trang công việc

Desktop tài khoản chia khối giới thiệu xanh biển và biểu mẫu; mobile chỉ giữ biểu mẫu. Các trang hồ sơ, nhập CSV, quản lý và cộng đồng dùng cùng thang chữ, điều khiển và bề mặt. Chờ khôi phục session trước khi quyết định chuyển hướng trang cần đăng nhập.

## Kiểm tra và giới hạn

Xem docs/SKILL-REVIEW.md và docs/design-evidence. Đã chạy kiểm tra trình duyệt và chụp ảnh; đây không phải nghiên cứu khả dụng độc lập hay đo FPS trên thiết bị thật. Không tự xác nhận giá trị CSV đúng về chuyên môn. Những bất nhất về nội dung cần đối chiếu nguồn, không được che bằng giao diện.
