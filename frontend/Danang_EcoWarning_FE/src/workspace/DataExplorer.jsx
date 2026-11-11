import { useResource } from "./useResource";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { dataApi, reports, unpack, displayTime } from "./api";
import { Feedback } from "./shared";

export default function DataExplorer() {
  const catalog = useResource(() =>
    dataApi.get("/metric/catalog").then(unpack),
  );
  const recurrence = useResource(() =>
    reports.get("/reports/recurrence").then(unpack),
  );
  const [asset, setAsset] = useState(""),
    [metric, setMetric] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const selectedAsset =
    asset ||
    String(
      catalog.value?.assets?.find((item) => item.asset_type === "Hành Chính")
        ?.id ||
        catalog.value?.assets?.[0]?.id ||
        "",
    );
  const metrics = useResource(
    () =>
      selectedAsset
        ? dataApi.get(`/metric/by-asset/${selectedAsset}`).then(unpack)
        : [],
    [selectedAsset],
  );
  const selectedMetric = metrics.value?.some(
    (item) => String(item.id) === metric,
  )
    ? metric
    : String(
        metrics.value?.find((item) => item.category === "Thời tiết")?.id ||
          metrics.value?.[0]?.id ||
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
  const points = (history.value?.timeSeries || [])
    .map((item) => ({
      ...item,
      value: Number(item.value),
      label: item.timestamp.slice(0, 10),
    }))
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const duplicateTimes =
    points.length - new Set(points.map((point) => point.timestamp)).size;
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Dữ liệu & thống kê</h1>
          <p>
            Tra cứu chuỗi khí hậu, nông nghiệp và thiệt hại theo dữ liệu lịch
            sử.
          </p>
        </div>
      </div>
      <Feedback resource={catalog}>
        <section className="ec-panel">
          <div className="ec-toolbar">
            <label>
              Khu vực / đối tượng
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setAsset(e.target.value);
                  setMetric("");
                }}
              >
                {catalog.value?.assets.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Chỉ số
              <select
                value={selectedMetric}
                onChange={(e) => setMetric(e.target.value)}
                disabled={metrics.loading}
              >
                {metrics.value?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.category} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Từ ngày
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <Feedback resource={metrics}>
            <Feedback resource={history} empty={!points.length}>
              <div className="ec-section-heading">
                <h2>{history.value?.metricName}</h2>
                <span>
                  {points.length} quan sát ·{" "}
                  {history.value?.unit || "Chưa có đơn vị"}
                </span>
              </div>
              <p className="ec-notice">
                Giá trị và đơn vị được giữ nguyên từ nguồn. Cần đối chiếu đơn vị
                trước khi diễn giải; không tự áp hệ số quy đổi.
              </p>
              {duplicateTimes > 0 ? (
                <p className="ec-notice">
                  Có {duplicateTimes} quan sát trùng thời điểm. Hiển thị bảng dữ
                  liệu gốc để đối chiếu, chưa nối thành một chuỗi xu hướng.
                </p>
              ) : (
                <div className="ec-data-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={points}
                      margin={{ top: 10, left: 10, right: 20, bottom: 10 }}
                    >
                      <CartesianGrid vertical={false} stroke="#e5e9eb" />
                      <XAxis dataKey="label" minTickGap={65} />
                      <YAxis width={70} />
                      <Tooltip />
                      <Line
                        name={history.value?.metricName}
                        dataKey="value"
                        stroke="#1d5fbf"
                        dot={points.length < 20}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <details open={duplicateTimes > 0}>
                <summary>Xem bảng số liệu ({points.length} dòng)</summary>
                <div className="ec-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Thời điểm quan trắc</th>
                        <th className="ec-numeric">Giá trị nguồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((point, index) => (
                        <tr key={`${point.timestamp}-${index}`}>
                          <td>{displayTime(point.timestamp)}</td>
                          <td className="ec-numeric">
                            {point.value.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Feedback>
          </Feedback>
          <p className="ec-source">
            {catalog.value?.source} · Phạm vi dữ liệu:{" "}
            {catalog.value?.years?.at(-1)?.year ?? "—"} –{" "}
            {catalog.value?.years?.[0]?.year ?? "—"}
          </p>
        </section>
      </Feedback>
      <section className="ec-panel">
        <h2>Khu vực có nhiều ghi nhận ngập</h2>
        <p>
          Chỉ tính báo cáo đã xác minh, loại bỏ báo cáo đã gộp. Nhóm theo ô tọa
          độ 0,01°, chưa phải ranh giới hành chính hay kết luận ngập tái diễn
          tại cùng một địa chỉ.
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
                {recurrence.value?.map((item) => (
                  <tr key={`${item.latitude}-${item.longitude}`}>
                    <td>
                      {item.latitude}, {item.longitude}
                    </td>
                    <td className="ec-numeric">{item.incident_count}</td>
                    <td>{displayTime(item.last_recorded)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Feedback>
      </section>
    </div>
  );
}
