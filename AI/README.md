# Flood AI — API tích hợp model ngập đô thị

Service FastAPI nội bộ nhận đặc trưng do BE chuẩn bị và chạy `best_model.pkl`.
Không cần Qdrant, embedding, database hoặc Excel để chạy dự đoán.

## Chạy local

Dùng Python **3.12** để khớp môi trường đã kiểm thử. Chạy từ thư mục gốc dự án:

```bash
python3.12 -m venv AI/.venv
source AI/.venv/bin/activate
python -m pip install -r AI/requirements.txt
cd AI
python -m server
```

Swagger: http://127.0.0.1:8000/docs. OpenAPI: http://127.0.0.1:8000/openapi.json.
Model được nạp một lần cho mỗi worker. Model thiếu, hỏng, sai cấu trúc hoặc sai
phiên bản scikit-learn sẽ làm startup thất bại; service không trả dự đoán giả.

## Chạy cùng Docker của BE

Từ thư mục gốc:

```bash
docker compose -f backend/docker-compose.yml --profile ai up -d --build ai-service
```

BE trong mạng `app-net` gọi `http://ai-service:8000`. BE chạy trên máy host gọi
`http://127.0.0.1:8000`. Compose chỉ công bố cổng trên loopback; service dành cho
BE nội bộ, không có xác thực hoặc CORS cho trình duyệt. Profile `ai` cho phép
bật riêng phần model khi cần. Service không cần đợi Postgres/Eureka.

## Hợp đồng dữ liệu với BE

| Endpoint | Chức năng |
| --- | --- |
| `POST /api/v1/flood/predict` | Dự đoán một điểm |
| `POST /api/v1/flood/predict/batch` | Dự đoán 1–1000 điểm trong một lần |
| `GET /api/v1/flood/model` | Thứ tự đặc trưng, nhãn, phiên bản, giới hạn |
| `GET /health/live` | Tiến trình hoạt động |
| `GET /health/ready` | Model đã sẵn sàng |

Mỗi điểm cần **đủ 9 tên trường, đúng chữ hoa/thường**:

| Trường | Vai trò trong dữ liệu huấn luyện |
| --- | --- |
| `X`, `Y` | Tọa độ trong hệ quy chiếu của dữ liệu huấn luyện |
| `Slope` | Độ dốc |
| `Curvature` | Độ cong địa hình |
| `Aspect` | Hướng địa hình |
| `TWI` | Chỉ số ẩm địa hình |
| `FA` | Đặc trưng FA trong dataset; cần xác nhận định nghĩa/cách tính |
| `Drainage` | Đặc trưng thoát nước; cần xác nhận định nghĩa/cách tính |
| `Rainfall` | Lượng mưa theo đúng cách tổng hợp của dữ liệu huấn luyện |

Notebook không khai báo CRS, đơn vị hay kỳ tích lũy mưa. BE phải xác nhận những
thông tin này với người chuẩn bị dữ liệu trước khi dùng dữ liệu Đà Nẵng. Không
tự đổi tên `latitude` thành `X`, không lấy mưa tức thời thay cho trường `Rainfall`
khi chưa biết cách huấn luyện. Chỉ có tọa độ và lượng mưa chưa đủ tái tạo các
đặc trưng địa hình; BE cần lấy chúng từ lớp GIS tương ứng.

Giá trị là số JSON hữu hạn hoặc `null` nếu thực sự thiếu. Không chấp nhận chuỗi
số, boolean, trường lạ hoặc giá trị dương vượt giới hạn float32 của Random Forest.
`null`, `-9999`, và giá trị `<= -1e30` được chuyển thành NaN, rồi điền bằng **trung
vị đã học trong model**, giống notebook. Không tính lại trung vị từ request.
Điểm thiếu toàn bộ đặc trưng bị từ chối. Trường bị bỏ quên sẽ trả 422 để BE phát
hiện lỗi mapping; muốn điền trung vị phải truyền rõ `null`.

Ví dụ từ **dòng 2 của dataset, không phải quan trắc Đà Nẵng**:

```json
{
  "point_id": "dataset-row-2",
  "features": {
    "X": 3.90944444444444,
    "Y": 7.44305555555555,
    "Slope": 46.6861419677734,
    "Curvature": -3888000000,
    "Aspect": 45,
    "TWI": -3.25036787986755,
    "FA": 147,
    "Drainage": 228.8528,
    "Rainfall": 101.51561643835623
  }
}
```

Gửi thử từ thư mục gốc:

```bash
curl -sS http://127.0.0.1:8000/api/v1/flood/predict \
  -H 'Content-Type: application/json' \
  --data-binary @AI/examples/very_high.json
```

Response chứa:

```json
{
  "point_id": "dataset-row-2",
  "prediction": 1,
  "label": "Flood",
  "flood_probability": 0.9780395698904072,
  "imputed_features": [],
  "model_version": "sha256:1d444882ca739ecfcfc1b9295ce19719017203aa0b4d089d6afd7f02d733adc2",
  "scope": "pluvial_flood_susceptibility"
}
```

Response trên là kết quả thực tế của artifact được cung cấp với mẫu dòng 2.
`flood_probability` được tính bằng `pipeline.predict_proba`.
`prediction` lấy từ `pipeline.predict`, không làm tròn
xác suất. `0`/`No_Flood` là lớp không ngập; `1`/`Flood` gộp các nhãn gốc `Low`,
`Moderate`, `High`, `Very_High`. Model này **không dự đoán 5 mức độ**, độ sâu ngập
hoặc thời điểm ngập. Xác suất của model chưa được chứng minh là xác suất thực tế
đã hiệu chỉnh tại Đà Nẵng. `point_id` là chuỗi tùy chọn được trả lại nguyên vẹn.
`imputed_features` liệt kê những trường đã được điền trung vị.

Batch dùng cùng cấu trúc điểm:

```json
{
  "points": [
    {"point_id": "cell-001", "features": {"X": 3.9, "Y": 7.4, "Slope": 60, "Curvature": 0, "Aspect": 190, "TWI": -8, "FA": 1, "Drainage": 220, "Rainfall": null}}
  ]
}
```

Response batch là `{"count": 1, "predictions": [...]}` và giữ thứ tự đầu vào.
Nếu có điểm không hợp lệ, toàn bộ request trả 422; đường dẫn `detail[].loc` chỉ
ra điểm/trường bị lỗi. BE nên chia lưới khu vực thành các batch tối đa 1000 điểm,
gắn `point_id` để nối lại với geometry của BE. API không tự tổng hợp xác suất cho
cả khu vực vì model chỉ được huấn luyện ở cấp điểm.

HTTP 422: sửa dữ liệu rồi gửi lại. HTTP 503: model chưa sẵn sàng. HTTP 500: lỗi
suy luận, xem log AI. BE cần đặt timeout, xử lý lỗi thành trạng thái “chưa có kết
quả”, tránh đổi lỗi API thành kết luận “không ngập”.

### Ví dụ caller Spring Boot

Trong BE, cấu hình `FLOOD_AI_BASE_URL` theo môi trường và dùng HTTP client có
connect/read timeout. Ví dụ với Spring Boot 3.5 / Spring RestClient:

```java
var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
factory.setConnectTimeout(2000);
factory.setReadTimeout(15000);
var client = org.springframework.web.client.RestClient.builder()
    .baseUrl(System.getenv().getOrDefault("FLOOD_AI_BASE_URL", "http://127.0.0.1:8000"))
    .requestFactory(factory)
    .build();

// payload là DTO hoặc Map có point_id và features đúng hợp đồng ở trên.
var result = client.post()
    .uri("/api/v1/flood/predict")
    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
    .body(payload)
    .retrieve()
    .body(java.util.Map.class);
```

Thư mục này cung cấp API và hợp đồng; việc thu thập GIS/quan trắc, chọn service
BE gọi API, lưu kết quả và hiển thị lên FE do luồng nghiệp vụ của BE quyết định.

## Cấu trúc

```text
AI/
├── server.py                      # FastAPI, lifecycle và lệnh python -m server
├── api/models/flood.py             # Request/response, validation
├── api/routers/flood.py            # HTTP endpoints
├── application/flood_prediction.py # Điều phối suy luận
├── domain/flood.py                 # Tên đặc trưng, nhãn
├── infra/flood_model.py            # Load pipeline, chuẩn hóa NoData
├── shared/settings/flood.py        # Cấu hình FLOOD_*
├── artifacts/best_model.pkl        # Model được cung cấp
├── artifacts/metadata.json         # Nguồn gốc, checksum, metadata còn thiếu
├── notebooks/notebook-mnm.ipynb    # Notebook gốc để tham chiếu
├── examples/                      # Hai mẫu có/không ngập từ dataset
└── tests/flood/                    # Kiểm thử hợp đồng và model thật
```

Các thư mục indexing/embedding/Qdrant cũ được giữ để không mất phần việc khác;
API flood không import chúng. `pytest.ini` chỉ chọn bộ kiểm thử flood vì hai file
test indexing cũ cần dữ liệu trên máy tác giả và dịch vụ ngoài.
Notebook gốc vẫn tham chiếu đường dẫn Kaggle; muốn huấn luyện lại cần đổi đường
dẫn dataset và chuẩn bị riêng môi trường huấn luyện. Không đưa Excel 144401 dòng
vào image/API; runtime chỉ cần artifact.

## Cấu hình và kiểm thử

Có thể sao chép `AI/.env.example` thành `AI/.env`. Mặc định model nằm tại
`AI/artifacts/best_model.pkl`, được xác định từ vị trí mã nguồn. Override bằng
`FLOOD_MODEL_PATH` (nên dùng đường dẫn tuyệt đối). `FLOOD_MODEL_N_JOBS=1` giới hạn
song song của Random Forest; nhiều worker sẽ nạp nhiều bản model vào RAM.
Chỉ triển khai artifact tin cậy do người vận hành cung cấp; không có endpoint
upload hoặc chọn model từ dữ liệu request.

```bash
python -m pip install -r AI/requirements-dev.txt
python -m pytest -c AI/pytest.ini AI/tests/flood -q
```

Kiểm thử đối chiếu API với pipeline gốc, mẫu nhãn dương/âm, thứ tự JSON, batch,
NoData, input sai, health và lỗi model. CI chạy cùng bộ kiểm thử trên Python 3.12.

scikit-learn được ghim **1.6.1**, là phiên bản được ghi trong artifact. Các phiên
bản thư viện huấn luyện khác chưa được notebook ghi lại; requirements là môi
trường suy luận đã kiểm thử, không phải bản sao đầy đủ môi trường Kaggle.
Tài liệu tham khảo: [scikit-learn model persistence](https://scikit-learn.org/stable/model_persistence.html)
và [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/).

## Giới hạn khi áp dụng tại Đà Nẵng

Notebook báo điểm test rất cao trên split ngẫu nhiên; kết quả đó không chứng minh
khả năng khái quát theo vùng hoặc theo thời gian. Tọa độ mẫu trong dataset nằm
khoảng X=3.9, Y=7.4, chưa có tài liệu CRS để chuyển sang Đà Nẵng. Trước khi công bố
dự báo địa phương, cần xác nhận nguồn/đơn vị đặc trưng, kiểm tra rò rỉ dữ liệu,
đánh giá trên tập Đà Nẵng độc lập và huấn luyện/hiệu chỉnh lại nếu cần. Hiện tại
service phục vụ tích hợp thử nghiệm model đánh giá tính dễ ngập do mưa.
