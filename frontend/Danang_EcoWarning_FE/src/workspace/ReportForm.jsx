import { useResource } from "./useResource";
import { compressImage } from "./image";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMapPin, FiUploadCloud, FiCheck } from "react-icons/fi";
import { reports, unpack, message } from "./api";
import { Feedback } from "./shared";
import { MapCanvas } from "./IncidentMap";
import { useAuth } from "../hooks/useAuth";

function localNow() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

const distance = (a, b) => {
  const r = Math.PI / 180,
    dlat = (a.latitude - b.latitude) * r,
    dlon = (a.longitude - b.longitude) * r;
  return (
    6371 *
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin(dlat / 2) ** 2 +
            Math.cos(a.latitude * r) *
              Math.cos(b.latitude * r) *
              Math.sin(dlon / 2) ** 2,
        ),
      ),
    )
  );
};

export default function ReportForm() {
  const { user } = useAuth(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const draftKey = `ec-report-draft:${user?.id || user?.email}`;
  const [form, setForm] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(draftKey));
      if (stored) return stored;
    } catch {
      /* Ignore a corrupt local draft and create a new one. */
    }
    return {
      reportType: "FLOOD",
      reportDescription: "",
      addressText: "",
      latitude: Number(params.get("lat")) || 16.0544,
      longitude: Number(params.get("lng")) || 108.2022,
      eventStartTime: localNow(),
      depth: "",
      key: crypto.randomUUID(),
    };
  });
  const [image, setImage] = useState(null),
    [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [saved, setSaved] = useState(false);
  const types = useResource(() => reports.get("/reports/types").then(unpack));
  const nearby = useResource(
    () =>
      reports
        .get("/reports", {
          params: { state: "ACTIVE", type: form.reportType, size: 200 },
        })
        .then(unpack),
    [form.reportType],
  );
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [form, draftKey]);
  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const change = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  async function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("Trình duyệt chưa hỗ trợ định vị. Bạn có thể chọn trên bản đồ.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (
          coords.latitude < 15.9 ||
          coords.latitude > 16.3 ||
          coords.longitude < 107.8 ||
          coords.longitude > 108.4
        ) {
          setError(
            "Vị trí hiện tại nằm ngoài phạm vi dữ liệu Đà Nẵng của dự án. Hãy chọn vị trí sự cố.",
          );
          return;
        }
        setForm((f) => ({
          ...f,
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        }));
      },
      () =>
        setError(
          "Chưa lấy được vị trí. Hãy cho phép định vị hoặc chọn trực tiếp trên bản đồ.",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  async function chooseImage(event) {
    setError("");
    const file = event.target.files[0];
    if (!file) return;
    try {
      setImage(await compressImage(file));
    } catch (err) {
      setError(err.message);
      event.target.value = "";
    }
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      if (!navigator.onLine)
        throw new Error(
          "Thiết bị đang ngoại tuyến. Bản nháp đã được giữ, hãy gửi khi có mạng.",
        );
      const payload = {
        reportType: form.reportType,
        reportDescription: form.reportDescription.trim(),
        addressText: form.addressText.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        eventStartTime: new Date(form.eventStartTime).toISOString(),
        eventEndTime: null,
        details:
          form.reportType === "FLOOD" && form.depth !== ""
            ? { estimatedDepthCm: Number(form.depth), floodType: "street" }
            : {},
      };
      const body = new FormData();
      body.append(
        "request",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );
      if (image) body.append("image", image);
      const result = await reports
        .post("/reports", body, {
          headers: { "Idempotency-Key": form.key },
          onUploadProgress: (event) =>
            setProgress(
              event.total ? Math.round((event.loaded / event.total) * 100) : 0,
            ),
        })
        .then(unpack);
      localStorage.removeItem(draftKey);
      navigate(`/incidents/${result.id}`, { state: { created: true } });
    } catch (err) {
      setError(err.response ? message(err) : err.message);
    } finally {
      setBusy(false);
    }
  }
  const suggestions = (nearby.value?.items || [])
    .filter((row) => distance(form, row) < 1)
    .slice(0, 4);
  return (
    <div className="ec-page ec-report-page">
      <div className="ec-page-heading">
        <div>
          <h1>Báo cáo sự cố</h1>
          <p>
            Chia sẻ điều bạn quan sát được. Báo cáo sẽ được tiếp nhận để xác
            minh.
          </p>
        </div>
        <Link to="/">Về bản đồ</Link>
      </div>
      <form className="ec-report-grid" onSubmit={submit}>
        <section className="ec-panel">
          <h2>Thông tin ghi nhận</h2>
          <p className="ec-muted">Các trường có dấu * là bắt buộc.</p>
          <label>
            Loại sự cố *
            <select
              value={form.reportType}
              onChange={(e) => change("reportType", e.target.value)}
              required
              disabled={busy || types.loading}
            >
              {types.value?.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          {types.error && (
            <div className="ec-error">
              {types.error}
              <button type="button" onClick={types.reload}>
                Tải lại loại sự cố
              </button>
            </div>
          )}
          <label>
            Mô tả sự cố *
            <textarea
              value={form.reportDescription}
              onChange={(e) => change("reportDescription", e.target.value)}
              required
              minLength={5}
              maxLength={500}
              rows={4}
              placeholder="Tình trạng tại vị trí này như thế nào?"
              disabled={busy}
            />
            <small>{form.reportDescription.length}/500 ký tự</small>
          </label>
          <label>
            Địa chỉ hoặc mốc dễ nhận biết
            <input
              value={form.addressText}
              onChange={(e) => change("addressText", e.target.value)}
              maxLength={500}
              placeholder="Tên đường, đoạn giao hoặc địa điểm"
              disabled={busy}
            />
          </label>
          <div className="ec-filter-grid">
            <label>
              Thời điểm ghi nhận *
              <input
                type="datetime-local"
                value={form.eventStartTime}
                max={localNow()}
                onChange={(e) => change("eventStartTime", e.target.value)}
                required
                disabled={busy}
              />
            </label>
            {form.reportType === "FLOOD" && (
              <label>
                Độ ngập ước tính (cm)
                <input
                  type="number"
                  value={form.depth}
                  min="0"
                  max="1000"
                  step="1"
                  onChange={(e) => change("depth", e.target.value)}
                  placeholder="Chưa rõ thì để trống"
                  disabled={busy}
                />
              </label>
            )}
          </div>
          <label className="ec-upload">
            <FiUploadCloud />
            <span>Thêm ảnh minh chứng</span>
            <small>JPG, PNG, WebP · Ảnh được nén trước khi gửi</small>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={chooseImage}
              disabled={busy}
            />
          </label>
          {preview && (
            <div className="ec-image-preview">
              <img src={preview} alt="Ảnh minh chứng sắp gửi" />
              <button
                type="button"
                onClick={() => setImage(null)}
                disabled={busy}
              >
                Bỏ ảnh
              </button>
              <small>{Math.round(image.size / 1024)} KB sau nén</small>
            </div>
          )}
          <p className="ec-muted">
            <FiCheck />{" "}
            {saved
              ? "Nội dung đã lưu nháp trên thiết bị. Ảnh cần chọn lại nếu đóng trang."
              : "Chưa lưu được bản nháp trên thiết bị."}
          </p>
          {error && (
            <p role="alert" className="ec-error">
              {error}
            </p>
          )}
          <button
            className="ec-button"
            type="submit"
            disabled={busy || !types.value?.length}
          >
            {busy
              ? progress === 100
                ? "Đang lưu báo cáo…"
                : `Đang gửi ${progress}%`
              : "Gửi báo cáo"}
          </button>
        </section>
        <section>
          <div className="ec-panel">
            <div className="ec-section-heading">
              <h2>Vị trí sự cố</h2>
              <button type="button" onClick={locate} disabled={busy}>
                <FiMapPin />
                Vị trí hiện tại
              </button>
            </div>
            <p>Chạm lên bản đồ để chọn đúng nơi xảy ra sự cố.</p>
            <div className="ec-picker">
              <MapCanvas
                items={[{ ...form, id: "•", status: "PENDING" }]}
                center={form}
                onPick={(point) => {
                  if (!busy) setForm((f) => ({ ...f, ...point }));
                }}
              />
            </div>
            <div className="ec-filter-grid">
              <label>
                Vĩ độ *
                <input
                  type="number"
                  step="0.000001"
                  min="15.9"
                  max="16.3"
                  required
                  value={form.latitude}
                  onChange={(e) => change("latitude", e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Kinh độ *
                <input
                  type="number"
                  step="0.000001"
                  min="107.8"
                  max="108.4"
                  required
                  value={form.longitude}
                  onChange={(e) => change("longitude", e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>
          </div>
          <div className="ec-panel">
            <h2>Có thể đã có người báo cáo</h2>
            <p className="ec-muted">
              Gợi ý trong bán kính 1 km từ tối đa 200 báo cáo gần đây cùng loại.
            </p>
            <Feedback resource={nearby}>
              {suggestions.length ? (
                suggestions.map((row) => (
                  <Link
                    className="ec-nearby"
                    key={row.id}
                    to={`/incidents/${row.id}`}
                  >
                    #{row.id} · {row.address_text || row.report_description}
                    <span>Bổ sung thông tin →</span>
                  </Link>
                ))
              ) : (
                <p>
                  Chưa thấy báo cáo gần vị trí đã chọn trong tập dữ liệu đang
                  tải.
                </p>
              )}
            </Feedback>
          </div>
        </section>
      </form>
    </div>
  );
}
