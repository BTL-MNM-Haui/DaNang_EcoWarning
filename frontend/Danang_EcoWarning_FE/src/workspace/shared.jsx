import { Link } from "react-router-dom";
import { labels, displayTime } from "./api";

export function Feedback({ resource, empty = false, emptyContent, children }) {
  if (resource.loading)
    return (
      <p className="ec-loading" role="status">
        Đang tải dữ liệu…
      </p>
    );
  if (resource.error)
    return (
      <div className="ec-error" role="alert">
        <p>{resource.error}</p>
        <button onClick={resource.reload}>Thử lại</button>
      </div>
    );
  if (empty && emptyContent) return emptyContent;
  if (empty)
    return (
      <div className="ec-empty">
        <h3>Chưa có dữ liệu phù hợp</h3>
        <p>Thử đổi bộ lọc hoặc quay lại khi có cập nhật mới.</p>
      </div>
    );
  return children;
}
export function Status({ value }) {
  return (
    <span className={`ec-status ec-status--${value?.toLowerCase()}`}>
      {labels[value] || value}
    </span>
  );
}
export function IncidentRow({ report, selected = false, onSelect }) {
  return (
    <article className={`ec-incident ${selected ? "is-selected" : ""}`}>
      <div className="ec-incident-meta">
        <span>
          #{report.id} · {report.type_name}
        </span>
        {report.stale && <span className="ec-stale">Cần cập nhật lại</span>}
      </div>
      <h3>
        {onSelect ? (
          <button className="ec-link" onClick={() => onSelect(report)}>
            {report.address_text || "Vị trí được ghim trên bản đồ"}
          </button>
        ) : (
          <Link to={`/incidents/${report.id}`}>
            {report.address_text || "Vị trí được ghim trên bản đồ"}
          </Link>
        )}
      </h3>
      <p>{report.report_description}</p>
      <div className="ec-statuses">
        <Status value={report.status} />
        <Status value={report.incident_state} />
      </div>
      <small>
        Cập nhật: {displayTime(report.updated_at)} · Báo cáo cộng đồng
      </small>
    </article>
  );
}
