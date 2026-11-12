import { useState } from "react";
import "./data-explorer.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  FiDownload,
  FiBarChart2,
  FiList,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";
import { useResource } from "./useResource";
import { dataApi, reports, unpack, displayTime } from "./api";
import { Feedback } from "./shared";
import {
  historyView,
  formatValue,
  calendarLabel,
  observationsCsv,
} from "./dataModel";
const qualityLabels = {
  VALID: "Hợp lệ",
  CONFLICT: "Xung đột",
  REPEATED: "Trùng giá trị",
  MISSING: "Thiếu giá trị",
};
export default function DataExplorer() {
  const catalog = useResource(() =>
    dataApi.get("/metric/catalog").then(unpack),
  );
  const recurrence = useResource(() =>
    reports.get("/reports/recurrence").then(unpack),
  );
  const [section, setSection] = useState("history"),
    [asset, setAsset] = useState(""),
    [category, setCategory] = useState(""),
    [metric, setMetric] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [view, setView] = useState("chart"),
    [qualityFilter, setQualityFilter] = useState(""),
    [tablePage, setTablePage] = useState(0);
  const selectedAsset = asset || String(catalog.value?.assets?.[0]?.id || "");
  const metrics = useResource(
    () =>
      selectedAsset
        ? dataApi.get(`/metric/by-asset/${selectedAsset}`).then(unpack)
        : [],
    [selectedAsset],
  );
  const categories = [...new Set((metrics.value || []).map((m) => m.category))];
  const available = (metrics.value || []).filter(
    (m) => !category || m.category === category,
  );
  const selectedMetric = available.some((m) => String(m.id) === metric)
    ? metric
    : String(
        available.find((m) => m.category === "Thời tiết")?.id ||
          available[0]?.id ||
          "",
      );
  const history = useResource(
    () =>
      selectedAsset && selectedMetric
        ? dataApi
            .get("/metric/history", {
              params: {
                assetId: selectedAsset,
                metricId: selectedMetric,
                ...(from ? { fromDate: from } : {}),
                ...(to ? { toDate: to } : {}),
              },
            })
            .then(unpack)
        : null,
    [selectedAsset, selectedMetric, from, to],
  );
  const model = historyView(history.value),
    quality = history.value?.quality,
    unit = history.value?.unit || "Chưa rõ đơn vị";
  const chosen = available.find((m) => String(m.id) === selectedMetric);
  const filtered = model.records.filter(
      (p) => !qualityFilter || p.quality === qualityFilter,
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 25)),
    currentPage = Math.min(tablePage, pages - 1),
    visible = filtered.slice(currentPage * 25, currentPage * 25 + 25);
  const issues =
    (quality?.conflictTimestamps || 0) +
    (quality?.repeatedRecords || 0) +
    (quality?.missingValues || 0);
  const resetTable = () => {
    setTablePage(0);
    setQualityFilter("");
  };
  function exportCsv() {
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([observationsCsv(model.records)], {
          type: "text/csv;charset=utf-8",
        }),
      );
    a.href = url;
    a.download = `observations-${selectedAsset}-${selectedMetric}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="ec-page ec-data-page">
      <div className="ec-page-heading">
        <div>
          <h1>Dữ liệu & thống kê</h1>
          <p>
            Chọn một bộ số liệu. Xem diễn biến và kiểm tra chất lượng trước khi
            sử dụng.
          </p>
        </div>
        {section === "history" && (
          <button
            className="ec-button ec-secondary"
            disabled={history.loading || !model.records.length}
            onClick={exportCsv}
          >
            <FiDownload aria-hidden="true" />
            Tải CSV
          </button>
        )}
      </div>
      <div className="ec-data-sections" role="group" aria-label="Nguồn dữ liệu">
        <button
          aria-pressed={section === "history"}
          onClick={() => setSection("history")}
        >
          Dữ liệu lịch sử
        </button>
        <button
          aria-pressed={section === "incidents"}
          onClick={() => setSection("incidents")}
        >
          Ghi nhận ngập cộng đồng
        </button>
      </div>
      {section === "history" ? (
        <Feedback resource={catalog}>
          <section className="ec-dataset-picker" aria-label="Chọn bộ số liệu">
            <div className="ec-dataset-fields">
              <label>
                Khu vực / đối tượng
                <select
                  value={selectedAsset}
                  onChange={(e) => {
                    setAsset(e.target.value);
                    setCategory("");
                    setMetric("");
                    resetTable();
                  }}
                >
                  {catalog.value?.assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nhóm dữ liệu
                <select
                  value={category}
                  disabled={metrics.loading}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setMetric("");
                    resetTable();
                  }}
                >
                  <option value="">Tất cả nhóm</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Chỉ số cần xem
                <select
                  value={selectedMetric}
                  disabled={metrics.loading || !available.length}
                  onChange={(e) => {
                    setMetric(e.target.value);
                    resetTable();
                  }}
                >
                  {available.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.unit || "Chưa rõ đơn vị"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <details className="ec-date-range">
              <summary>
                Giới hạn khoảng thời gian
                {(from || to) && <span>Đang áp dụng</span>}
              </summary>
              <div>
                <label>
                  Từ ngày
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      resetTable();
                    }}
                  />
                </label>
                <label>
                  Đến ngày
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => {
                      setTo(e.target.value);
                      resetTable();
                    }}
                  />
                </label>
                <button
                  className="ec-button ec-secondary"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    resetTable();
                  }}
                >
                  Toàn bộ thời gian
                </button>
              </div>
            </details>
          </section>
          <Feedback resource={metrics} empty={!available.length}>
            <section className="ec-dataset-result">
              <Feedback resource={history} empty={!model.records.length}>
                <header className="ec-dataset-heading">
                  <div>
                    <h2>{history.value?.metricName}</h2>
                    <p className="ec-dataset-category">
                      {history.value?.assetName} · {chosen?.category}
                    </p>
                  </div>
                  <span className="ec-unit-label">
                    Đơn vị: <strong>{unit}</strong>
                  </span>
                </header>
                <dl className="ec-dataset-summary">
                  <div>
                    <dt>Bản ghi nguồn</dt>
                    <dd>{model.records.length.toLocaleString("vi-VN")}</dd>
                  </div>
                  <div>
                    <dt>Phạm vi đang xem</dt>
                    <dd>
                      {calendarLabel(model.first, model.annual)}{" "}
                      <FiArrowRight aria-hidden="true" />{" "}
                      {calendarLabel(model.last, model.annual)}
                    </dd>
                  </div>
                  <div>
                    <dt>Điểm dùng cho biểu đồ</dt>
                    <dd>{quality?.usablePoints ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Thời điểm xung đột</dt>
                    <dd
                      className={
                        quality?.conflictTimestamps ? "ec-value-warning" : ""
                      }
                    >
                      {quality?.conflictTimestamps ?? "—"}
                    </dd>
                  </div>
                </dl>
                {issues > 0 ? (
                  <div className="ec-quality-summary">
                    <FiAlertCircle aria-hidden="true" />
                    <div>
                      <strong>Có dữ liệu cần đối chiếu</strong>
                      <p>
                        {quality.conflictTimestamps > 0
                          ? `${quality.conflictTimestamps} thời điểm có giá trị khác nhau. Các điểm này tạo khoảng ngắt trên biểu đồ. `
                          : ""}
                        {quality.repeatedRecords > 0
                          ? `${quality.repeatedRecords} bản ghi lặp cùng giá trị được tính một lần trên biểu đồ. `
                          : ""}
                        {quality.missingValues > 0
                          ? `${quality.missingValues} bản ghi thiếu giá trị.`
                          : ""}{" "}
                        Bảng và CSV giữ nguyên mọi bản ghi nguồn.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setView("table");
                        setQualityFilter(
                          quality.conflictTimestamps ? "CONFLICT" : "",
                        );
                        setTablePage(0);
                      }}
                    >
                      Đối chiếu dữ liệu
                    </button>
                  </div>
                ) : (
                  <p className="ec-quality-clear">
                    <FiCheckCircle aria-hidden="true" />
                    Không phát hiện xung đột hoặc bản ghi lặp trong bộ số liệu
                    đang xem.
                  </p>
                )}
                <div className="ec-dataset-viewbar">
                  <div
                    className="ec-data-view-switch"
                    role="group"
                    aria-label="Cách xem số liệu"
                  >
                    <button
                      aria-pressed={view === "chart"}
                      onClick={() => setView("chart")}
                    >
                      <FiBarChart2 aria-hidden="true" />
                      Biểu đồ
                    </button>
                    <button
                      aria-pressed={view === "table"}
                      onClick={() => setView("table")}
                    >
                      <FiList aria-hidden="true" />
                      Bảng dữ liệu
                    </button>
                  </div>
                  <span>
                    {view === "chart"
                      ? "Giá trị theo thời điểm quan trắc"
                      : `${filtered.length} bản ghi`}
                  </span>
                </div>
                {view === "chart" ? (
                  <>
                    {quality?.usablePoints > 0 ? (
                      <div className="ec-history-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={model.trend}
                            margin={{ top: 20, right: 20, left: 0, bottom: 12 }}
                          >
                            <CartesianGrid vertical={false} stroke="#d4dfe5" />
                            <XAxis
                              dataKey="label"
                              minTickGap={40}
                              tick={{ fill: "#334d5d", fontSize: 14 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              width={72}
                              tick={{ fill: "#334d5d", fontSize: 14 }}
                              tickFormatter={formatValue}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              formatter={(value) => [
                                `${formatValue(value)} ${unit}`,
                                history.value?.metricName,
                              ]}
                              labelStyle={{ color: "#153648" }}
                              contentStyle={{
                                border: "1px solid #9eafba",
                                borderRadius: 8,
                                fontSize: 15,
                              }}
                            />
                            <Line
                              name={history.value?.metricName}
                              dataKey="number"
                              stroke="#08749c"
                              strokeWidth={3}
                              connectNulls={false}
                              dot={
                                quality.usablePoints <= 24 ? { r: 4 } : false
                              }
                              activeDot={{ r: 6 }}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="ec-empty">
                        <h3>Chưa có điểm đủ điều kiện để vẽ biểu đồ</h3>
                        <p>
                          Bạn vẫn có thể xem và tải toàn bộ bản ghi trong bảng
                          dữ liệu.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="ec-data-table-tools">
                      <label>
                        Chất lượng bản ghi
                        <select
                          value={qualityFilter}
                          onChange={(e) => {
                            setQualityFilter(e.target.value);
                            setTablePage(0);
                          }}
                        >
                          <option value="">Tất cả bản ghi</option>
                          {Object.entries(qualityLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                    <div className="ec-table-scroll">
                      <table className="ec-observation-table">
                        <thead>
                          <tr>
                            <th>Thời điểm quan trắc</th>
                            <th className="ec-numeric">Giá trị ({unit})</th>
                            <th>Chất lượng</th>
                            <th>Mã bản ghi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((p, i) => (
                            <tr
                              key={p.id ?? i}
                              className={
                                p.quality === "CONFLICT" ? "is-conflict" : ""
                              }
                            >
                              <td>
                                {calendarLabel(p.timestamp, model.annual)}
                              </td>
                              <td className="ec-numeric">
                                {formatValue(p.value)}
                              </td>
                              <td>
                                <span
                                  className={`ec-data-quality is-${p.quality?.toLowerCase()}`}
                                >
                                  {qualityLabels[p.quality] || "Chưa phân loại"}
                                </span>
                              </td>
                              <td>#{p.id ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!visible.length && (
                        <p className="ec-empty">
                          Không có bản ghi thuộc nhóm này.
                        </p>
                      )}
                    </div>
                    {pages > 1 && (
                      <div className="ec-pagination">
                        <button
                          disabled={!currentPage}
                          onClick={() => setTablePage(currentPage - 1)}
                        >
                          Trước
                        </button>
                        <span>
                          Trang {currentPage + 1} / {pages}
                        </span>
                        <button
                          disabled={currentPage + 1 >= pages}
                          onClick={() => setTablePage(currentPage + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                )}
                <details className="ec-data-provenance">
                  <summary>Nguồn và cách đọc số liệu</summary>
                  <p>
                    {history.value?.source}. Giá trị được giữ nguyên; đơn vị chỉ
                    được chuẩn hóa cách viết, không quy đổi. Nhãn đơn vị gốc:{" "}
                    <strong>
                      {history.value?.unitRaw || "Chưa được cung cấp"}
                    </strong>
                    .
                  </p>
                  <p>
                    Phạm vi trên chỉ thuộc bộ số liệu và bộ lọc đang chọn. Thời
                    điểm quan trắc không phải thời điểm cập nhật trực tiếp. Các
                    điểm xung đột được bỏ khỏi xu hướng, không chọn ngầm một giá
                    trị thay thế.
                  </p>
                </details>
              </Feedback>
            </section>
          </Feedback>
        </Feedback>
      ) : (
        <section className="ec-panel">
          <h2>Nhóm vị trí có nhiều ghi nhận ngập</h2>
          <p>
            Chỉ tính báo cáo đã xác minh và chưa gộp. Nhóm theo ô tọa độ 0,01°,
            không phải ranh giới hành chính hay kết luận ngập tái diễn tại cùng
            địa chỉ.
          </p>
          <Feedback resource={recurrence} empty={!recurrence.value?.length}>
            <div className="ec-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ô tọa độ</th>
                    <th className="ec-numeric">Số sự cố</th>
                    <th>Ghi nhận gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {recurrence.value?.map((p) => (
                    <tr key={`${p.latitude}-${p.longitude}`}>
                      <td>
                        {p.latitude}, {p.longitude}
                      </td>
                      <td className="ec-numeric">{p.incident_count}</td>
                      <td>{displayTime(p.last_recorded)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Feedback>
        </section>
      )}
    </div>
  );
}
