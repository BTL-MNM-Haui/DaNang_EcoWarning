---
name: DaNang EcoWarning
description: Giao diện tra cứu và cập nhật sự cố cộng đồng
colors:
  primary: "#086b91"
  ground: "#f2f8fb"
  surface: "#ffffff"
  muted: "#4f6670"
  border: "#cbdfe5"
  chart: "#086b91"
  danger: "#a32e32"
typography:
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
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
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: DaNang EcoWarning

## Overview

Giao diện làm việc theo hướng bản đồ và danh sách sự cố. Thiết kế lại từ hệ thống hiện có theo yêu cầu người dùng; các lựa chọn triển khai được giao cho người thực hiện. Giữ cấu trúc từ hướng taste-skill achromatic-ledger, bổ sung bảng màu xanh biển và xanh ngọc theo yêu cầu người dùng. Giao diện ưu tiên khả năng tra cứu, chất lượng dữ liệu và thao tác báo cáo.

Màn hình sử dụng số liệu từ API. Không thêm số đếm trang trí, xu hướng hoặc lời khẳng định về tình trạng hiện tại khi không có dữ liệu.

## Colors

Hành động chính dùng xanh biển #086b91, hover #07536f. Điều hướng dùng nền xanh ngọc nhạt #e6f3f6, mục đang chọn #c5e5ec với chữ #07506a. Nội dung dùng mực #123c4b trên nền #f2f8fb. Các bảng/biểu mẫu dùng bề mặt trắng và đường phân cách nhẹ. Hai nguồn thời tiết dùng nền xanh trời #edf7ff và xanh lá nhạt #edf8f3; màu chỉ nhận diện khu vực, không biểu thị mức độ an toàn của số liệu.

Màu xanh của biểu đồ dùng cho dữ liệu lịch sử. Trạng thái đang diễn ra có dấu đỏ, chờ xác minh có dấu nâu vàng, đã kết thúc dùng xanh lá; mỗi trạng thái luôn kèm chữ, không dùng màu làm tín hiệu duy nhất. Màu trong nền bản đồ thuộc lớp dữ liệu của nhà cung cấp, không phải màu trang trí ứng dụng.

## Typography

Geist được tải từ Google Fonts, có fallback system-ui. Số liệu dùng tabular numerals. Tiêu đề trang 26px/600, tiêu đề phần 17px/600, nội dung 14px. Các nhãn phụ từ 11–13px. Nút và nhãn viết theo câu, không kéo giãn chữ hoa.

Logo là SVG hình ghim địa điểm với đường sóng; chữ trong logo dùng Arial để asset hoạt động độc lập trong README và trình duyệt.

## Layout

Desktop dùng rail 76px, mở thành sidebar 256px khi hover hoặc focus bàn phím, phần nội dung dành đúng chiều rộng tương ứng và không bị menu che. Thiết bị cảm ứng rộng giữ sidebar đầy đủ; dưới 850px dùng menu. Từ 1280px, bản đồ trải toàn vùng làm việc và danh sách nổi rộng 330px; ở desktop hẹp dùng hai cột. Trên điện thoại chuyển giữa Bản đồ và Danh sách. Canvas WebGL nằm trong khung tuyệt đối để resize không làm tăng chiều cao hàng grid.

Các trang nội dung dùng padding 34px 32px và tối đa 1500px. Form báo cáo dùng hai cột trên desktop, một cột trên điện thoại. Dưới 850px, sidebar chuyển thành thanh đầu 60px và menu mở; người dùng chọn Bản đồ hoặc Danh sách. Dưới 520px, nội dung dùng lề 16px. Bảng dữ liệu có vùng cuộn riêng khi cần.

## Elevation & Depth

Bề mặt ứng dụng phẳng, phân tách bằng đường viền. Marker trên bản đồ có bóng nhỏ để đọc được trên nền bản đồ; không áp bóng này cho panel. Không dùng gradient hoặc glass làm trang trí.

## Shapes

Panel bo góc 14px, khối thời tiết 16px, control 6px. Marker sự cố tròn, có số định danh. Logo và favicon dùng cùng ngôn ngữ ghim và sóng.

## Components

- Nút chính nền xanh biển, nhãn trắng, chiều cao tối thiểu 42px; trạng thái disabled giảm độ đậm và không nhận thao tác.
- Input/select/textarea có nhãn nhìn thấy và focus outline xanh 3px; lỗi chỉ rõ cách thử lại hoặc sửa nội dung.
- Một báo cáo có hai nhãn độc lập: xác minh và diễn biến.
- Danh sách giữ trạng thái tải, lỗi, rỗng và phân trang. Số 0 được hiển thị là 0.
- Chi tiết sự cố hiển thị thời điểm quan sát, cập nhật, nguồn và lịch sử. Cập nhật cộng đồng không tự làm mới trạng thái xác minh.
- Form báo cáo có lưu nháp nội dung; ảnh không lưu bền trên thiết bị và giao diện nói rõ cần chọn lại khi đóng trang.
- Bản đồ giữ nhận diện/attribution của Goong; các overlay ứng dụng tránh che thông tin này.

## Do's and Don'ts

- Do dùng nhãn rõ ràng bên cạnh màu trạng thái.
- Do giữ đơn vị và nguồn; báo vấn đề chất lượng trước khi diễn giải.
- Do hiển thị lỗi từng nguồn thời tiết độc lập.
- Don't vẽ một xu hướng từ các quan sát trùng thời điểm chưa được đối chiếu.
- Don't coi báo cáo chưa xác minh là cảnh báo chính thức.
- Don't đưa thông tin kỹ thuật về mô hình hoặc dữ liệu mẫu vào luồng công cộng.

## Navigation and map refinement

Rail có nhãn truy cập và tooltip; focus bàn phím mở menu, Escape đưa focus về main. Hover dùng chuyển động 200ms, reduced-motion tắt transition. Bộ lọc chính luôn hiện; bộ lọc thời gian/độ ngập trong details. Chỉ hiện phân trang bản đồ khi có trên 100 kết quả. Xem docs/UI-DIRECTION.md để phân biệt phần đã làm và đề xuất tiếp theo.

## Bố cục màn hình chính

Thời tiết: khối quan sát #07536f, chữ trắng và chữ phụ #d5edf5; biểu tượng điều kiện lấy theo mã OpenWeather. Bên cạnh là khối không khí với màu chữ theo chỉ số thực tế. Dự báo thành dải mốc 3 giờ, cuộn ngang khi cần; bảng chi tiết vẫn có thể mở. Từ 1100px trở xuống phần tổng quan xếp một cột.

Dữ liệu: bộ chọn rộng 260px ở cột trái, kết quả biểu đồ/bảng ở cột phải. Dưới 851px bộ chọn lên trên kết quả. Panel 14px, khối thời tiết 16px; tiêu đề trang 30px, mobile 26px. Không thêm dữ liệu minh họa.
