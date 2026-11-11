import { useResource } from "./useResource";
import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { reports, unpack, message, displayTime, isManager } from "./api";
import { Feedback, Status, IncidentRow } from "./shared";
import { useAuth } from "../hooks/useAuth";
import { compressImage } from "./image";

export function IncidentList({ manage = false }) {
  const [status, setStatus] = useState(manage ? "PENDING" : ""),
    [page, setPage] = useState(0);
  const resource = useResource(
    () =>
      reports
        .get(manage ? "/admin/reports" : "/reports/mine", {
          params: { status, page, size: 20, includeMerged: true },
        })
        .then(unpack),
    [manage, status, page],
  );
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>{manage ? "Xác minh sự cố" : "Báo cáo của tôi"}</h1>
          <p>
            {manage
              ? "Kiểm tra căn cứ trước khi xác minh. Diễn biến sự cố được cập nhật riêng."
              : "Theo dõi báo cáo đã gửi và các phản hồi mới."}
          </p>
        </div>
        <Link className="ec-button" to="/report">
          Báo cáo mới
        </Link>
      </div>
      <div className="ec-toolbar">
        <label>
          Xác minh
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {["PENDING", "VERIFIED", "REJECTED"].map((value) => (
              <option key={value} value={value}>
                {
                  {
                    PENDING: "Chờ xác minh",
                    VERIFIED: "Đã xác minh",
                    REJECTED: "Bị từ chối",
                  }[value]
                }
              </option>
            ))}
          </select>
        </label>
        <span>{resource.value?.total ?? "—"} báo cáo</span>
        <button onClick={resource.reload}>Tải lại</button>
      </div>
      <section className="ec-panel ec-report-list">
        <Feedback resource={resource} empty={!resource.value?.items.length}>
          {resource.value?.items.map((row) => (
            <IncidentRow key={row.id} report={row} />
          ))}
        </Feedback>
      </section>
      <div className="ec-pagination">
        <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Trước
        </button>
        <span>Trang {page + 1}</span>
        <button
          disabled={(page + 1) * 20 >= (resource.value?.total || 0)}
          onClick={() => setPage((p) => p + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export function IncidentDetail() {
  const { id } = useParams(),
    location = useLocation(),
    { user, isAuthenticated } = useAuth();
  const resource = useResource(
    () => reports.get(`/reports/${id}`).then(unpack),
    [id],
  );
  const [note, setNote] = useState(""),
    [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function contribute(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const body = new FormData();
      body.append("note", note);
      if (file) body.append("image", await compressImage(file));
      await reports.post(`/reports/${id}/updates`, body);
      setNote("");
      setFile(null);
      setSuccess(
        "Đã thêm thông tin. Cập nhật cộng đồng chưa làm thay đổi trạng thái xác minh.",
      );
      resource.reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  const row = resource.value;
  let details = {};
  try {
    details = JSON.parse(row?.details || "{}");
  } catch {
    /* Preserve a readable detail page when legacy JSON is invalid. */
  }
  return (
    <div className="ec-page">
      <Link to="/">← Bản đồ sự cố</Link>
      <Feedback resource={resource}>
        {row && (
          <>
            <div className="ec-page-heading">
              <div>
                <h1>Báo cáo #{row.id}</h1>
                <p>
                  {row.type_name} ·{" "}
                  {row.address_text || "Vị trí được ghim trên bản đồ"}
                </p>
              </div>
              <div className="ec-statuses">
                <Status value={row.status} />
                <Status value={row.incident_state} />
              </div>
            </div>
            {(location.state?.created || success) && (
              <p role="status" className="ec-success">
                {success ||
                  "Báo cáo đã được tiếp nhận. Bạn có thể theo dõi tại đây."}
              </p>
            )}
            {row.merged_into && (
              <p className="ec-notice">
                Báo cáo đã được gộp vào{" "}
                <Link to={`/incidents/${row.merged_into}`}>
                  sự cố #{row.merged_into}
                </Link>
                .
              </p>
            )}
            {row.stale && (
              <p className="ec-notice">
                Thông tin xác minh đã hơn 24 giờ chưa được cập nhật. Cần đối
                chiếu tình hình thực tế.
              </p>
            )}
            <div className="ec-detail-grid">
              <section className="ec-panel">
                <h2>Thông tin ghi nhận</h2>
                <p className="ec-description">{row.report_description}</p>
                {row.image_url && (
                  <img
                    className="ec-evidence"
                    src={row.image_url}
                    alt={`Ảnh minh chứng báo cáo ${row.id}`}
                    loading="lazy"
                  />
                )}
                <dl className="ec-facts">
                  <div>
                    <dt>Quan sát lúc</dt>
                    <dd>{displayTime(row.event_start_time)}</dd>
                  </div>
                  <div>
                    <dt>Cập nhật trạng thái</dt>
                    <dd>{displayTime(row.updated_at)}</dd>
                  </div>
                  <div>
                    <dt>Tọa độ</dt>
                    <dd>
                      {row.latitude}, {row.longitude}
                    </dd>
                  </div>
                  <div>
                    <dt>Nguồn</dt>
                    <dd>Báo cáo cộng đồng</dd>
                  </div>
                  {details.estimatedDepthCm != null && (
                    <div>
                      <dt>Độ ngập ước tính</dt>
                      <dd>
                        {details.estimatedDepthCm} cm · Do người báo cáo ước
                        tính
                      </dd>
                    </div>
                  )}
                  {row.event_end_time && (
                    <div>
                      <dt>Kết thúc lúc</dt>
                      <dd>{displayTime(row.event_end_time)}</dd>
                    </div>
                  )}
                </dl>
                <h2>Diễn biến & phản hồi</h2>
                <ol className="ec-timeline">
                  {row.events?.map((event) => (
                    <li key={event.id}>
                      <time>{displayTime(event.created_at)}</time>
                      <strong>
                        {{
                          CREATED: "Tiếp nhận",
                          COMMUNITY_UPDATE: "Cộng đồng bổ sung",
                          MODERATED: "Quản lý cập nhật",
                          MERGED: "Gộp báo cáo",
                          LINKED_REPORT: "Liên kết báo cáo",
                        }[event.event_type] || "Cập nhật"}
                      </strong>
                      <p>{event.note}</p>
                      {event.image_url && (
                        <img
                          className="ec-evidence"
                          src={event.image_url}
                          alt="Ảnh bổ sung"
                          loading="lazy"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </section>
              <aside>
                {isManager(user) && !row.merged_into && (
                  <Moderation
                    key={`${row.id}-${row.version}`}
                    row={row}
                    onSaved={resource.reload}
                  />
                )}
                <section className="ec-panel">
                  <h2>Bổ sung tình hình</h2>
                  <p>
                    Chia sẻ ghi nhận mới hoặc ảnh tại vị trí này. Người quản lý
                    sẽ kiểm tra trước khi thay đổi trạng thái.
                  </p>
                  {!isAuthenticated ? (
                    <Link className="ec-button" to="/login">
                      Đăng nhập để đóng góp
                    </Link>
                  ) : row.canUpdate ? (
                    <form onSubmit={contribute}>
                      <label>
                        Nội dung cập nhật
                        <textarea
                          required
                          minLength={5}
                          maxLength={1000}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={4}
                        />
                      </label>
                      <label>
                        Ảnh bổ sung
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setFile(e.target.files[0] || null)}
                        />
                      </label>
                      {error && (
                        <p role="alert" className="ec-error">
                          {error}
                        </p>
                      )}
                      <button className="ec-button" disabled={busy}>
                        {busy ? "Đang gửi…" : "Gửi cập nhật"}
                      </button>
                    </form>
                  ) : (
                    <p>
                      Báo cáo này đã đóng góp sang sự cố chính hoặc không còn
                      nhận cập nhật.
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </Feedback>
    </div>
  );
}
function Moderation({ row, onSaved }) {
  const [status, setStatus] = useState(row.status),
    [state, setState] = useState(row.incident_state),
    [note, setNote] = useState(""),
    [target, setTarget] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await reports.patch(`/admin/reports/${row.id}`, {
        status,
        state,
        note,
        version: row.version,
        ...(target ? { mergedInto: Number(target) } : {}),
      });
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ec-panel">
      <h2>Xử lý báo cáo</h2>
      <form onSubmit={submit}>
        <label>
          Xác minh
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Chờ xác minh</option>
            <option value="VERIFIED">Đã xác minh</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </label>
        <label>
          Diễn biến
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="ACTIVE">Đang diễn ra</option>
            <option value="RESOLVED">Đã kết thúc</option>
            <option value="UNKNOWN">Chưa rõ</option>
          </select>
        </label>
        <label>
          Gộp vào sự cố khác (tùy chọn)
          <input
            type="number"
            min="1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="ID sự cố chính"
          />
        </label>
        <label>
          Căn cứ / lý do *
          <textarea
            required
            minLength={5}
            maxLength={800}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="ec-error">
            {error}
          </p>
        )}
        <button className="ec-button" disabled={busy}>
          {busy ? "Đang lưu…" : target ? "Gộp báo cáo" : "Lưu kết quả kiểm tra"}
        </button>
      </form>
    </section>
  );
}
