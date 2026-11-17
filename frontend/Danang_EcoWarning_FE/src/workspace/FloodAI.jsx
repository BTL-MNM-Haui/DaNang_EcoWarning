import { useState } from "react";
import { dataApi, unpack } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./shared";
import examples from "./floodExamples.json";
const { noFlood, flood } = examples;
export default function FloodAI() {
  const model = useResource(() => dataApi.get("/ai/flood/model").then(unpack));
  const [text, setText] = useState(
      JSON.stringify(
        {
          point_id: "",
          features: Object.fromEntries(
            [
              "X",
              "Y",
              "Slope",
              "Curvature",
              "Aspect",
              "TWI",
              "FA",
              "Drainage",
              "Rainfall",
            ].map((k) => [k, null]),
          ),
        },
        null,
        2,
      ),
    ),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sample, setSample] = useState(false);
  const load = (p) => {
    setText(JSON.stringify(p, null, 2));
    setSample(true);
    setResult(null);
    setError("");
  };
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const payload = JSON.parse(text);
      const r = await dataApi.post("/ai/flood/predict", payload);
      setResult(r.data);
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          (e instanceof SyntaxError
            ? "JSON chưa hợp lệ."
            : "Không lấy được kết quả AI. Hãy thử lại."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ec-page ec-flood-ai-page">
      <div className="ec-page-heading">
        <div>
          <h1>Thử nghiệm mô hình ngập</h1>
          <p>
            Dành cho người quản lý kiểm tra tích hợp mô hình với dữ liệu có
            nguồn gốc rõ ràng.
          </p>
        </div>
      </div>
      <p className="ec-notice">
        Mô hình chưa được kiểm chứng cho Đà Nẵng. Chưa xác nhận hệ tọa độ, đơn
        vị đặc trưng và kỳ tích lũy mưa trong dữ liệu huấn luyện. Không dùng kết
        quả làm cảnh báo ngập hiện tại hoặc chỉ dẫn tuyến đường an toàn.
      </p>
      <Feedback resource={model}>
        <section className="ec-panel">
          <h2>Thông tin mô hình</h2>
          <p>
            Thuật toán: {model.value?.algorithm} · Phiên bản:{" "}
            {model.value?.model_version}
          </p>
          <p>
            Đầu vào: {model.value?.feature_order?.join(", ")}. Chỉ nhập các đặc
            trưng được chuẩn bị theo hợp đồng của nhóm AI; không nhập kinh/vĩ độ
            thay thế X/Y khi chưa xác nhận CRS.
          </p>
        </section>
      </Feedback>
      <div className="ec-detail-grid">
        <form className="ec-panel" onSubmit={submit}>
          <h2>Dữ liệu thử nghiệm</h2>
          <div className="ec-toolbar">
            <button type="button" disabled={busy} onClick={() => load(noFlood)}>
              Nạp mẫu nhãn âm
            </button>
            <button type="button" disabled={busy} onClick={() => load(flood)}>
              Nạp mẫu nhãn dương
            </button>
          </div>
          <p className="ec-source">
            Hai mẫu từ dataset nhóm AI cung cấp, không phải quan trắc tại Đà
            Nẵng. Giá trị null sẽ được mô hình điền khuyết và liệt kê trong kết
            quả.
          </p>
          <label>
            Payload JSON
            <textarea
              disabled={busy}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSample(false);
                setResult(null);
              }}
              rows={19}
              spellCheck={false}
            />
          </label>
          {error && (
            <p className="ec-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="ec-button"
            disabled={busy || model.loading || !!model.error}
          >
            {busy ? "Đang chạy mô hình…" : "Chạy thử nghiệm"}
          </button>
        </form>
        <section className="ec-panel" aria-live="polite">
          <h2>Kết quả thử nghiệm</h2>
          {result ? (
            <>
              <p className="ec-notice">
                {sample
                  ? "Kết quả từ mẫu dataset thử nghiệm."
                  : "Kết quả cho bộ đặc trưng bạn cung cấp."}{" "}
                Không phải xác nhận tình trạng ngập tại một địa điểm thực tế.
              </p>
              <dl className="ec-facts">
                <div>
                  <dt>Nhãn mô hình</dt>
                  <dd>{result.label}</dd>
                </div>
                <div>
                  <dt>Điểm xác suất lớp Flood</dt>
                  <dd>{(result.flood_probability * 100).toFixed(2)}%</dd>
                </div>
                <div>
                  <dt>Đặc trưng điền khuyết</dt>
                  <dd>{result.imputed_features?.join(", ") || "Không có"}</dd>
                </div>
                <div>
                  <dt>Phiên bản</dt>
                  <dd>{result.model_version}</dd>
                </div>
              </dl>
              <p>
                Điểm của mô hình không đồng nghĩa với xác suất ngập thực tế đã
                được hiệu chỉnh cho địa phương.
              </p>
            </>
          ) : (
            <p>
              Chưa có kết quả. Chuẩn bị đầu vào hoặc nạp một mẫu dataset để kiểm
              tra luồng FE → BE → AI.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
