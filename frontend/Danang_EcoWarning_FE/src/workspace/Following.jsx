import { useResource } from "./useResource";
import { useState } from "react";
import { Link } from "react-router-dom";
import { reports, unpack, message, displayTime } from "./api";
import { Feedback } from "./shared";
import { MapCanvas } from "./IncidentMap";

export function WatchAreas() {
  const resource = useResource(() => reports.get("/watch-areas").then(unpack));
  const [form, setForm] = useState({
      name: "",
      latitude: 16.0544,
      longitude: 108.2022,
      radiusKm: 1,
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await reports.post("/watch-areas", form);
      setForm((f) => ({ ...f, name: "" }));
      resource.reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    setError("");
    try {
      await reports.delete(`/watch-areas/${id}`);
      resource.reload();
    } catch (err) {
      setError(message(err));
    }
  }
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Khu vực theo dõi</h1>
          <p>
            Nhận thông báo trong ứng dụng khi sự cố gần khu vực được xác minh
            hoặc cập nhật.
          </p>
        </div>
      </div>
      <div className="ec-detail-grid">
        <section className="ec-panel">
          <h2>Khu vực của tôi</h2>
          <Feedback
            resource={resource}
            empty={!resource.value?.length}
            emptyContent={
              <div className="ec-empty">
                <h3>Chưa có khu vực theo dõi</h3>
                <p>
                  Đặt tên, chọn vị trí và bán kính trong biểu mẫu để bắt đầu
                  theo dõi cập nhật gần đó.
                </p>
              </div>
            }
          >
            {resource.value?.map((area) => (
              <article className="ec-watch-row" key={area.id}>
                <div>
                  <h3>{area.name}</h3>
                  <p>
                    Bán kính {area.radius_km} km · {area.latitude},{" "}
                    {area.longitude}
                  </p>
                </div>
                <button onClick={() => remove(area.id)}>Bỏ theo dõi</button>
              </article>
            ))}
          </Feedback>
        </section>
        <section className="ec-panel">
          <h2>Thêm khu vực</h2>
          <form onSubmit={submit}>
            <label>
              Tên gợi nhớ
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nhà, trường, nơi làm việc…"
              />
            </label>
            <div className="ec-picker">
              <MapCanvas
                items={[{ ...form, id: "•" }]}
                center={form}
                onPick={(point) => setForm((f) => ({ ...f, ...point }))}
              />
            </div>
            <div className="ec-filter-grid">
              {[
                ["latitude", "Vĩ độ", 15.9, 16.3],
                ["longitude", "Kinh độ", 107.8, 108.4],
                ["radiusKm", "Bán kính (km)", 0.1, 20],
              ].map(([key, label, min, max]) => (
                <label key={key}>
                  {label}
                  <input
                    required
                    type="number"
                    step="any"
                    min={min}
                    max={max}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>
            {error && (
              <p className="ec-error" role="alert">
                {error}
              </p>
            )}
            <button className="ec-button" disabled={busy}>
              {busy ? "Đang lưu…" : "Theo dõi khu vực"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
export function Notifications() {
  const resource = useResource(() =>
    reports.get("/notifications").then(unpack),
  );
  const [error, setError] = useState("");
  async function read(id) {
    try {
      await reports.patch(`/notifications/${id}/read`);
      resource.reload();
    } catch (err) {
      setError(message(err));
    }
  }
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Thông báo</h1>
          <p>Cập nhật các sự cố trong khu vực bạn đang theo dõi.</p>
        </div>
        <button onClick={resource.reload}>Tải lại</button>
      </div>
      {error && (
        <p role="alert" className="ec-error">
          {error}
        </p>
      )}
      <section className="ec-panel">
        <Feedback
          resource={resource}
          empty={!resource.value?.length}
          emptyContent={
            <div className="ec-empty">
              <h2>Chưa có thông báo mới</h2>
              <p>
                Các cập nhật phù hợp sẽ xuất hiện khi sự cố gần khu vực bạn theo
                dõi được xác minh hoặc thay đổi.
              </p>
              <Link className="ec-button ec-secondary" to="/watch-areas">
                Chọn khu vực theo dõi
              </Link>
            </div>
          }
        >
          {resource.value?.map((item) => (
            <article
              className={`ec-notification ${item.read_at ? "" : "is-unread"}`}
              key={item.id}
            >
              <div>
                <small>
                  {displayTime(item.created_at)} ·{" "}
                  {item.read_at ? "Đã đọc" : "Chưa đọc"}
                </small>
                <p>
                  <Link to={`/incidents/${item.report_id}`}>
                    {item.message}
                  </Link>
                </p>
              </div>
              {!item.read_at && (
                <button onClick={() => read(item.id)}>Đánh dấu đã đọc</button>
              )}
            </article>
          ))}
        </Feedback>
      </section>
    </div>
  );
}
