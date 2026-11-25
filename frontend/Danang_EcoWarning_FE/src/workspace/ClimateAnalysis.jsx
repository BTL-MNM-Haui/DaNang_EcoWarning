import { useState } from "react";
import { dataApi } from "./api";
import { formatValue, calendarLabel } from "./dataModel";
export default function ClimateAnalysis({
  assetId,
  metricId,
  from,
  to,
  onResult,
}) {
  const [confirmed, setConfirmed] = useState(false),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function analyze() {
    setBusy(true);
    setResult(null);
    onResult?.(null);
    setError("");
    try {
      const r = await dataApi.get("/metric/anomalies", {
        params: {
          assetId,
          metricId,
          unitConfirmed: confirmed,
          ...(from ? { fromDate: from } : {}),
          ...(to ? { toDate: to } : {}),
        },
      });
      setResult(r.data);
      onResult?.(r.data);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Chưa phân tích được. Cần chỉ số khí hậu theo tháng, tên/đơn vị phù hợp và đã được đối chiếu với nguồn.",
      );
    } finally {
      setBusy(false);
    }
  }
  function exportResult() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              assetId,
              metricId,
              from: from || null,
              to: to || null,
              unitConfirmed: confirmed,
              generatedAt: new Date().toISOString(),
              ...result,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "climate-analysis.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="ec-data-provenance">
      <summary>Phân tích bất thường khí hậu theo mùa</summary>
      <p>
        Phân tích hồi cứu bằng trung vị và MAD, không phải mô hình dự báo ngập.
        Cần ít nhất 60 quan sát tháng, đủ 12 tháng trong năm; bỏ các mốc xung
        đột và không tự điền thiếu.
      </p>
      <label
        style={{ display: "flex", alignItems: "start", gap: 12, marginTop: 16 }}
      >
        <input
          style={{ width: 20, minHeight: 24, flexShrink: 0 }}
          type="checkbox"
          checked={confirmed}
          onChange={(e) => {
            setConfirmed(e.target.checked);
            setResult(null);
            onResult?.(null);
          }}
        />
        Tôi đã đối chiếu đơn vị và ý nghĩa chỉ số với nguồn dữ liệu.
      </label>
      <button
        className="ec-button"
        disabled={!confirmed || busy}
        onClick={analyze}
      >
        {busy ? "Đang phân tích…" : "Phân tích bộ số liệu"}
      </button>
      {error && (
        <p className="ec-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite">
          <p>{result.message}</p>
          <button onClick={exportResult}>Tải kết quả JSON</button>
          {result.candidates.length > 0 && (
            <p>
              Dấu đỏ trên biểu đồ chỉ các mốc cần đối chiếu trong bảng bên dưới.
            </p>
          )}
          <p>
            {result.usableObservations} quan sát dùng được ·{" "}
            {result.excludedConflictTimestamps} thời điểm xung đột bị loại ·
            Ngưỡng MAD: {result.threshold}
          </p>
          {result.status === "completed" &&
            (result.candidates.length ? (
              <div className="ec-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Thời điểm</th>
                      <th>Giá trị</th>
                      <th>Trung vị cùng tháng</th>
                      <th>Độ lệch</th>
                      <th>Điểm MAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.candidates.map((p) => (
                      <tr key={p.recordId}>
                        <td>{calendarLabel(p.timestamp)}</td>
                        <td>{formatValue(p.value)}</td>
                        <td>{formatValue(p.referenceMedian)}</td>
                        <td>{formatValue(p.deviation)}</td>
                        <td>
                          {p.score === null
                            ? "Tham chiếu không phân tán"
                            : formatValue(Number(p.score.toFixed(2)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                Không tìm thấy mốc vượt quy tắc thống kê trong tập đang phân
                tích.
              </p>
            ))}
        </div>
      )}
    </details>
  );
}
