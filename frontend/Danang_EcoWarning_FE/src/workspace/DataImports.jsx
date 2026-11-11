import { useResource } from "./useResource";
import { useState } from "react";
import { collector, unpack, message, displayTime } from "./api";
import { Feedback } from "./shared";

export default function DataImports() {
  const history = useResource(() =>
    collector.get("/admin/data-imports").then(unpack),
  );
  const [file, setFile] = useState(null),
    [source, setSource] = useState(""),
    [mapping, setMapping] = useState({
      assetId: "assetId",
      metricId: "metricId",
      recordTime: "recordTime",
      value: "value",
      unit: "unit",
    }),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState("");
  async function inspect(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    setPreview(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("source", source);
      body.append("mapping", JSON.stringify(mapping));
      setPreview(
        await collector.post("/admin/data-imports/preview", body).then(unpack),
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    try {
      const result = await collector
        .post(`/admin/data-imports/${preview.id}/commit`)
        .then(unpack);
      setSuccess(
        `Đã nhập ${result.inserted} quan sát. Dữ liệu cũ được giữ nguyên.`,
      );
      setPreview(null);
      history.reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  function downloadErrors() {
    const rows = preview.rows.filter((row) => row.error);
    const safe = (value) =>
      '"' +
      String(value)
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""') +
      '"';
    const blob = new Blob(
      [
        "\uFEFFdong,loi\r\n" +
          rows.map((row) => `${row.line},${safe(row.error)}`).join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "loi-nhap-du-lieu.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Nhập dữ liệu</h1>
          <p>
            Kiểm tra trước khi lưu. Mỗi phiên nhập ghi rõ nguồn và lịch sử thực
            hiện.
          </p>
        </div>
      </div>
      <section className="ec-panel">
        <h2>Nhập quan sát từ CSV</h2>
        <p>
          CSV UTF-8, phân tách dấu phẩy, tối đa 2 MB / 2.000 dòng. Thời gian
          dạng <code>2024-01-01T00:00:00</code>. ID phải có trong dữ liệu hiện
          tại, đơn vị phải khớp chỉ số.
        </p>
        <form onSubmit={inspect}>
          <label>
            Nguồn dữ liệu *
            <input
              required
              maxLength={300}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPreview(null);
              }}
              placeholder="Tên bộ dữ liệu, cơ quan hoặc đường dẫn nguồn"
            />
          </label>
          <label>
            File CSV *
            <input
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => {
                setFile(e.target.files[0]);
                setPreview(null);
              }}
            />
          </label>
          <div className="ec-import-mapping">
            {Object.keys(mapping).map((key) => (
              <label key={key}>
                Cột {key}
                <input
                  required
                  value={mapping[key]}
                  onChange={(e) => {
                    setMapping((m) => ({ ...m, [key]: e.target.value }));
                    setPreview(null);
                  }}
                />
              </label>
            ))}
          </div>
          <button className="ec-button" disabled={busy}>
            {busy ? "Đang xử lý…" : "Kiểm tra & xem trước"}
          </button>
        </form>
        {error && (
          <p role="alert" className="ec-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="ec-success">
            {success}
          </p>
        )}
      </section>
      {preview && (
        <section className="ec-panel">
          <div className="ec-section-heading">
            <h2>Xem trước {preview.rows.length} dòng</h2>
            {!preview.valid && (
              <button onClick={downloadErrors}>Tải các dòng lỗi</button>
            )}
          </div>
          <p>
            {preview.valid
              ? "Tất cả các dòng vượt qua bước kiểm tra. Xác nhận để lưu."
              : "Có dòng lỗi. Sửa file hoặc ánh xạ cột, sau đó kiểm tra lại."}
          </p>
          <div className="ec-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dòng</th>
                  <th>Đối tượng</th>
                  <th>Chỉ số</th>
                  <th>Thời gian</th>
                  <th>Giá trị</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.line}>
                    <td>{row.line}</td>
                    <td>{row.assetId ?? "—"}</td>
                    <td>{row.metricId ?? "—"}</td>
                    <td>{row.recordTime ?? "—"}</td>
                    <td>{row.value ?? "—"}</td>
                    <td>{row.error || "Hợp lệ"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="ec-button"
            disabled={busy || !preview.valid}
            onClick={commit}
          >
            Xác nhận nhập dữ liệu
          </button>
        </section>
      )}
      <section className="ec-panel">
        <h2>Lịch sử nhập</h2>
        <Feedback resource={history} empty={!history.value?.length}>
          <div className="ec-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>File / nguồn</th>
                  <th>Thời điểm</th>
                  <th>Trạng thái</th>
                  <th className="ec-numeric">Số dòng đã nhập</th>
                </tr>
              </thead>
              <tbody>
                {history.value?.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.file_name}
                      <small className="ec-block">{row.source}</small>
                    </td>
                    <td>{displayTime(row.created_at)}</td>
                    <td>
                      {row.status === "COMMITTED" ? "Đã lưu" : "Đã xem trước"}
                    </td>
                    <td className="ec-numeric">{row.inserted_count}</td>
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
