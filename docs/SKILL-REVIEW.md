# Bằng chứng sử dụng taste-skill và impeccable

Ngày thực hiện: 12/11/2026. Nhánh: feat/friendly-layout-redesign.

## Skill được đọc và áp dụng

| Skill | Nguồn trên máy | Phần dùng trong lượt này |
| --- | --- | --- |
| taste-skill | E:/mnm haui/taste-skill/skills/taste-skill/SKILL.md | App screens, kiểm tra trình duyệt, bố cục ở nhiều kích thước và đọc ảnh kết quả |
| impeccable | E:/mnm haui/impeccable/.agents/skills/impeccable/SKILL.md | animate, typeset, new-work, craft-floor; kiểm tra motion, chữ, tương phản và detector |

Skill là hướng dẫn và công cụ hỗ trợ, không phải một lời bảo đảm giao diện tốt. Việc hỏi người dùng phải làm rõ quyết định còn thiếu. Lượt này người dùng đã chọn: giữ mọi quan sát xung đột, đánh dấu và loại các thời điểm đó khỏi biểu đồ xu hướng. Các lựa chọn cỡ chữ, độ tương phản và nhánh Git đã rõ từ yêu cầu.

## Lệnh đã chạy và kết quả gốc

```powershell
node 'E:\mnm haui\taste-skill\skills\taste-skill\scripts\inspect.mjs' http://127.0.0.1:5173/data --app --out .taste-skill/final-data-inspect
& 'E:\mnm haui\impeccable\.agents\skills\impeccable\scripts\impeccable.cmd' detect --json frontend/Danang_EcoWarning_FE/src/workspace
```

- [Output taste inspector](design-evidence/taste-inspect.txt): 0 FAIL, 0 WARN; font Be Vietnam Pro 100% ở mẫu kiểm tra.
- [JSON measurements](design-evidence/taste-report.json).
- [Output impeccable detector](design-evidence/impeccable-detect.json): một cảnh báo border-accent-on-rounded ở tab. Giữ đường dưới tab vì đó là dấu chọn; selector đã đặt border-radius: 0, không phải viền dày quanh card bo góc. Không coi detector sạch là bằng chứng đủ về UX.
- [Ảnh desktop](design-evidence/taste-desktop.jpg), [tablet](design-evidence/taste-tablet.jpg), [mobile](design-evidence/taste-mobile.jpg).

## Kiểm thử chức năng và khả năng đọc

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Bấm menu rồi rời chuột, đảo hover nhanh, bàn phím, Escape, reduced motion, loading map, touch menu | 27 assertion qua | [navigation-check.json](design-evidence/navigation-check.json) |
| 14 route/màn hình ở 1440/768/390px, session, overflow, font, dữ liệu xung đột | 138 assertion qua | [all-layout-check.json](design-evidence/all-layout-check.json) |
| Đơn vị catalog/by-asset, giữ giá trị nguồn, gap ở 2022, phạm vi bộ lọc | 143 assertion qua | [data-contract-check.json](design-evidence/data-contract-check.json) |
| Tương phản màu tính từ CSS đang render | Chữ input 11,84:1; border 3,79:1; metadata 7,55:1 | [contrast-check.json](design-evidence/contrast-check.json) |
| Java: nhãn đơn vị, xung đột/lặp/thiếu/zero/precision | 4 test qua | SearchServiceHelperTests, ObservationQualityTests |
| FE: thiếu/zero, khoảng ngắt và CSV | 3 test qua | tests/dataModel.test.mjs |
| Các luồng HTTP hiện có | 28 kiểm tra qua, fixture đã xóa | scripts/integration-test.mjs |

Tài khoản dùng để xem các trang được bảo vệ là tài khoản tạm example.invalid, được tạo và xóa trong script; không dùng hoặc công khai thông tin đăng nhập thật. Ảnh loading giữ request style Goong ở trạng thái chờ để kiểm tra đúng giai đoạn tải, không tạo dữ liệu bản đồ giả.

### Chạy lại

```powershell
$env:TASTE_SKILL_DIR='E:\mnm haui\taste-skill\skills\taste-skill'
node scripts/ui-navigation-check.mjs http://localhost:4173
node scripts/ui-layout-check.mjs http://localhost:4173
node scripts/data-contract-check.mjs http://localhost:4173
```

ui-layout-check cần backend/.env và Docker local để tạo/xóa fixture. data-contract-check đối chiếu bộ CSV hiện có trên máy, gồm trường hợp diện tích điều được phản ánh trong ảnh người dùng; không dùng làm kiểm thử CI cho database tùy ý.

## Xem thay đổi thực tế

- [Dữ liệu tổng quan](design-evidence/data-overview.jpg).
- [Đối chiếu bản ghi xung đột](design-evidence/data-conflicts-1440.jpg).
- [Bản điện thoại](design-evidence/data-conflicts-390.jpg).
- [Thông báo tải bản đồ gọn](design-evidence/map-loading-1440.jpg).
- [Sidebar sau click và rời chuột](design-evidence/sidebar-after-click-leave.jpg).
- [Tài khoản](design-evidence/account-layout.jpg), [biểu mẫu báo cáo](design-evidence/report-form.jpg).

## Giới hạn

Đây là kiểm tra tự động và xem ảnh trong cùng phiên local, không phải đánh giá độc lập. Chưa đo FPS trên thiết bị của người dùng, chưa kiểm thử tải, chưa xác nhận độ đúng chuyên môn của toàn bộ CSV, chưa kiểm chứng gửi OTP/Cloudinary thật. Không thay đổi AI. Các giá trị bất nhất được trình bày để đối chiếu; không xóa, gộp hay sửa ngầm.

## Màn hình Phân tích AI — 25/11/2026

Theo yêu cầu mới, thay màn hình JSON dành riêng cho quản lý bằng workspace `/ai`: lối vào trong menu chính và đầu bản đồ, form số chia vị trí/địa hình/thủy văn, mẫu dataset thật, phản hồi mô hình và tải kết quả. Trang xem được với khách; quyền chạy model vẫn được BE bảo vệ. Không thay thuật toán, model hay suy đoán đơn vị/hệ tọa độ.

Áp dụng taste-skill qua `SKILL.md`, `references/app-screens.md` và draw `--app --kind analytics --style accent-ladder --keep palette,type`. Chọn nhịp hai cột đầu vào/kết quả cho công việc kiểm tra mô hình; giữ Be Vietnam Pro và palette đã chốt. Inventory: 9 đặc trưng, mã điểm, 2 mẫu dataset, model version/algorithm từ API, nhãn Flood/No_Flood, điểm lớp Flood, đặc trưng điền khuyết, nguồn mẫu/custom và trạng thái quyền/kết nối. Không có KPI/độ chính xác giả.

Áp dụng impeccable từ `E:/mnm haui/impeccable/.agents/skills/impeccable/SKILL.md`: chạy context cho FloodAI.jsx, đọc new-work/craft-floor, giữ hệ thống thị giác hiện hành. Đã chạy detector trên JSX/CSS: không có finding. Context ghi nhận sidecar thiết kế cũ và phiên bản skill mới hơn; không tự cập nhật skill/sidecar trong thay đổi UI này.

Kiểm tra local: 30 kiểm tra browser ở 1440/768/390, đăng nhập ADMIN/USER bằng mật khẩu và OTP SMTP Mailpit; hai mẫu đi qua FE → Java → Python trả hai nhãn thật. Xác nhận JSON tải xuống khớp đầu vào/kết quả, sửa đầu vào xóa kết quả cũ, consent điền khuyết, UI 503 không có kết quả giả, label input, bề rộng, mobile đưa kết quả vào tầm nhìn và backend từ chối token USER. 503 là lỗi chèn ở trình duyệt; suy luận thành công không bị mock. 3 unit test hợp đồng form, lint/build và 6 kiểm tra AI integration cũng qua.

Ảnh và báo cáo chạy browser nằm trong `.taste-skill/ai-workspace-proof/` (local, Git ignored); đã xem ảnh desktop/tablet/mobile và sửa hash phiên bản tràn mobile. Taste inspector cho trang khách: 0 FAIL, 1 WARN ragged-row; cột form 9 trường dài hơn cột tóm tắt được giữ theo công việc thay vì kéo giãn panel rỗng. Taste source lint: 0 FAIL, 1 WARN monospace; chỉ textarea JSON dùng monospace nên giữ. Kiểm tra này không chứng minh độ chính xác dự báo cho Đà Nẵng hay khả năng gửi email ra Internet.

## Tab đánh giá model — 25/11/2026

Mở rộng UI AI hiện hành, giữ font/palette/token của DESIGN.md. Chọn Gini thật của model làm bảng ngang ở đầu để thấy độ chênh thực tế; không kéo các trọng số nhỏ lên gần bằng nhau. Các biểu đồ offline của notebook được đặt ở vùng riêng, có cảnh báo điểm quy đổi và nguồn. Mobile giữ đủ chữ, có dialog xem ảnh gốc; không redraw ảnh để giả số liệu thô.

Đã chạy impeccable context và detector trên FloodEvaluation.jsx/ai-evaluation.css. Một cảnh báo border-accent-on-rounded được giữ vì phần bị đánh dấu là đường dưới tab, đã đặt border-radius: 0; không phải card có viền nhấn. Đã xem ảnh desktop/390px và kiểm tra ở 768px; bổ sung phóng to vì nhãn trong PNG nguồn quá nhỏ nếu chỉ thu ảnh theo chiều rộng mobile. Checklist FE, nguồn thực/mô phỏng và lỗi sửa được ghi trong IMPLEMENTATION.md.
