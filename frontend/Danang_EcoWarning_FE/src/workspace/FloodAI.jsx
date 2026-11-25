import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { dataApi, isManager, message, unpack } from "./api";
import { useResource } from "./useResource";
import examples from "./floodExamples.json";
import {
  blankFeatures,
  featureGroups,
  featureNames,
  isMissing,
  makeFloodPayload,
  readFloodJson,
} from "./floodForm.mjs";

const shortVersion = (value) =>
  value?.startsWith("sha256:") ? `${value.slice(0, 19)}…` : value;

export default function FloodAI() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const canRun = !authLoading && isAuthenticated && isManager(user);
  const model = useResource(
    () =>
      canRun
        ? dataApi.get("/ai/flood/model").then(unpack)
        : Promise.resolve(null),
    [canRun],
  );
  const [values, setValues] = useState(blankFeatures),
    [pointId, setPointId] = useState("");
  const [source, setSource] = useState("custom"),
    [allowMissing, setAllowMissing] = useState(false);
  const [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [json, setJson] = useState("");
  const entered = featureNames.filter(
    (k) => values[k] !== "" && !isMissing(Number(values[k])),
  ).length;
  const ready = canRun && !!model.value && !model.loading && !model.error;
  function change(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    setSource("custom");
    setResult(null);
    setError("");
  }
  function load(payload, kind = "custom") {
    setValues(
      Object.fromEntries(
        featureNames.map((k) => [k, payload.features[k] ?? ""]),
      ),
    );
    setPointId(payload.point_id || "");
    setSource(kind);
    setResult(null);
    setError("");
    setAllowMissing(false);
  }
  function reset() {
    setValues(blankFeatures());
    setPointId("");
    setSource("custom");
    setResult(null);
    setError("");
    setAllowMissing(false);
    setJson("");
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!ready) return;
    let payload;
    try {
      payload = makeFloodPayload(values, pointId);
      if (Object.values(payload.features).some(isMissing) && !allowMissing)
        throw Error(
          "Hãy xác nhận cho phép điền khuyết các đặc trưng chưa có trước khi phân tích.",
        );
    } catch (e) {
      setError(e.message);
      return;
    }
    setBusy(true);
    try {
      const response = await dataApi
        .post("/ai/flood/predict", payload)
        .then(unpack);
      if (
        !["Flood", "No_Flood"].includes(response.label) ||
        !Number.isFinite(response.flood_probability) ||
        response.flood_probability < 0 ||
        response.flood_probability > 1
      )
        throw Error(
          "Phản hồi mô hình chưa đúng hợp đồng; chưa thể hiển thị kết quả.",
        );
      setResult({ response, payload, source, at: new Date().toISOString() });
    } catch (e) {
      setError(
        typeof e.response?.data?.detail === "string"
          ? e.response.data.detail
          : e.response
            ? message(e)
            : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  const status = !canRun
    ? "Chưa kết nối · cần quyền quản lý"
    : model.loading
      ? "Đang kết nối mô hình…"
      : model.error
        ? "Mô hình chưa sẵn sàng"
        : "Đã kết nối mô hình";
  return (
    <div className="ec-page ec-ai-workspace">
      <header className="ec-page-heading">
        <div>
          <h1>Phân tích AI</h1>
          <p>
            Chuẩn bị dữ liệu, chạy mô hình và đối chiếu kết quả trong cùng một
            nơi.
          </p>
        </div>
        <a className="ec-ai-climate-link" href="#climate-analysis">
          Phân tích khí hậu <FiArrowRight aria-hidden="true" />
        </a>
      </header>
      <section className="ec-ai-scope" aria-label="Phạm vi thử nghiệm">
        <strong>Mô hình ngập đang ở giai đoạn thử nghiệm</strong>
        <p>
          Chưa kiểm chứng cho Đà Nẵng; chưa xác nhận hệ tọa độ, đơn vị đầu vào
          và kỳ tích lũy mưa. Kết quả dùng để kiểm tra mô hình, chưa phải cảnh
          báo ngập hiện tại.
        </p>
      </section>
      <div className="ec-ai-connection" role="status">
        <span className={`ec-ai-service-state ${ready ? "is-ready" : ""}`}>
          <FiActivity aria-hidden="true" />
          {status}
        </span>
        {canRun && model.value && (
          <span title={model.value.model_version}>
            {model.value.algorithm} · {shortVersion(model.value.model_version)}
          </span>
        )}
        {canRun && (
          <button
            type="button"
            className="ec-quiet"
            onClick={model.reload}
            disabled={busy || model.loading}
            aria-label="Kết nối lại mô hình"
          >
            <FiRefreshCw aria-hidden="true" /> Kết nối lại
          </button>
        )}
      </div>
      {canRun && model.error && (
        <p className="ec-error" role="alert">
          {model.error} Kiểm tra dịch vụ AI rồi chọn Kết nối lại.
        </p>
      )}
      {!canRun && !authLoading && (
        <div className="ec-ai-access">
          <div>
            <strong>
              {isAuthenticated
                ? "Tài khoản này chưa có quyền chạy mô hình"
                : "Xem giao diện và chuẩn bị dữ liệu trước khi đăng nhập"}
            </strong>
            <p>
              Bạn có thể nạp mẫu và xem các trường đầu vào. Chạy mô hình cần tài
              khoản quản lý; kết quả chỉ xuất hiện sau khi dịch vụ AI phản hồi.
            </p>
          </div>
          {!isAuthenticated && (
            <Link className="ec-button" to="/login" state={{ from: "/ai" }}>
              Đăng nhập để chạy AI
            </Link>
          )}
        </div>
      )}
      <div className="ec-ai-layout">
        <form className="ec-panel ec-ai-input" onSubmit={submit}>
          <div className="ec-ai-section-heading">
            <div>
              <h2>Dữ liệu đầu vào</h2>
              <p>Nạp một mẫu dataset hoặc nhập bộ đặc trưng của bạn.</p>
            </div>
            <span className="ec-ai-count">{entered}/9 trường có dữ liệu</span>
          </div>
          <div className="ec-ai-samples" aria-label="Mẫu dữ liệu thử nghiệm">
            <button
              type="button"
              disabled={busy}
              onClick={() => load(examples.noFlood, "dataset")}
              data-ai-sample="negative"
            >
              Nạp mẫu nhãn không ngập
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => load(examples.flood, "dataset")}
              data-ai-sample="positive"
            >
              Nạp mẫu nhãn ngập
            </button>
            <button
              type="submit"
              disabled={!ready || busy}
              className="ec-ai-quick-run"
            >
              {busy ? "Đang phân tích…" : "Phân tích đầu vào"}
            </button>
          </div>
          <p className="ec-ai-source">
            {source === "dataset"
              ? "Đang dùng mẫu từ dataset nhóm AI cung cấp, không phải quan trắc tại Đà Nẵng."
              : "Đầu vào do bạn cung cấp. Giữ nguyên cách biểu diễn và đơn vị của dữ liệu nguồn."}
          </p>
          <label className="ec-ai-point">
            Mã điểm <span className="ec-muted">(tùy chọn)</span>
            <input
              value={pointId}
              maxLength={128}
              disabled={busy}
              onChange={(e) => {
                setPointId(e.target.value);
                setSource("custom");
                setResult(null);
              }}
              placeholder="Mã tham chiếu trong dữ liệu nguồn"
            />
          </label>
          {featureGroups.map((group) => (
            <fieldset
              key={group.title}
              className="ec-ai-fieldset"
              disabled={busy}
            >
              <legend>{group.title}</legend>
              <div className="ec-ai-fields">
                {group.fields.map(([key, title]) => (
                  <label key={key} htmlFor={`ai-${key}`}>
                    <span>
                      {title} <small>{key}</small>
                    </span>
                    <input
                      id={`ai-${key}`}
                      type="number"
                      step="any"
                      value={values[key]}
                      onChange={(e) => change(key, e.target.value)}
                      placeholder="Chưa có giá trị"
                      aria-describedby="ai-input-help"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <p id="ai-input-help" className="ec-ai-help">
            Không tự thay X/Y bằng kinh/vĩ độ hoặc đổi đơn vị khi chưa xác nhận
            dữ liệu huấn luyện. Ô trống được gửi dưới dạng null; 0 vẫn là một
            giá trị.
          </p>
          {entered < 9 && (
            <label className="ec-ai-imputation">
              <input
                type="checkbox"
                checked={allowMissing}
                disabled={busy}
                onChange={(e) => {
                  setAllowMissing(e.target.checked);
                  setError("");
                }}
              />
              <span>
                Cho phép mô hình điền khuyết trường trống và mã NoData. Kết quả
                sẽ liệt kê các trường đã điền.
              </span>
            </label>
          )}
          <details className="ec-ai-json">
            <summary>Nhập từ JSON hoặc xem dữ liệu gửi đi</summary>
            <label>
              Payload JSON
              <textarea
                rows={7}
                spellCheck={false}
                value={json}
                disabled={busy}
                onChange={(e) => setJson(e.target.value)}
                placeholder="Dán point_id và đủ 9 trường features"
              />
            </label>
            <div className="ec-toolbar">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  try {
                    load(readFloodJson(json));
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Áp dụng JSON
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  try {
                    setJson(
                      JSON.stringify(
                        makeFloodPayload(values, pointId),
                        null,
                        2,
                      ),
                    );
                    setError("");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Xem payload hiện tại
              </button>
            </div>
          </details>
          {error && (
            <p className="ec-error" role="alert">
              {error}
            </p>
          )}
          <div className="ec-ai-submit">
            <button
              className="ec-button"
              type="submit"
              disabled={!ready || busy}
            >
              {busy ? "Đang phân tích…" : "Phân tích bằng mô hình"}
            </button>
            <button type="button" disabled={busy} onClick={reset}>
              Xóa dữ liệu
            </button>
          </div>
        </form>
        <div className="ec-ai-output-column">
          <FloodResult result={result} busy={busy} />
          <section className="ec-ai-contract">
            <h2>Trước khi dùng dữ liệu thực</h2>
            <p>
              Cần xác nhận với nhóm AI ba phần còn thiếu trong hợp đồng dữ liệu:
            </p>
            <ul>
              <li>Hệ tọa độ của X và Y</li>
              <li>Đơn vị của các đặc trưng</li>
              <li>Khoảng thời gian tích lũy lượng mưa</li>
            </ul>
            <p>
              Trang này không tự lấy thời tiết hiện tại để ghép thành đầu vào.
            </p>
          </section>
        </div>
      </div>
      <section id="climate-analysis" className="ec-ai-climate">
        <div>
          <h2>Phân tích bất thường khí hậu</h2>
          <p>
            Đối chiếu quan sát lịch sử theo mùa bằng trung vị và MAD. Chọn khu
            vực, chỉ số và xác nhận đơn vị trong Dữ liệu &amp; thống kê; đây là
            phân tích thống kê, tách biệt với mô hình ngập.
          </p>
        </div>
        <Link to="/data">
          Mở dữ liệu khí hậu <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

function FloodResult({ result, busy }) {
  const heading = useRef(null);
  useEffect(() => {
    if (result && window.matchMedia("(max-width: 850px)").matches) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, [result]);
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...result, experimental: true, validated_for_da_nang: false },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "ecowarning-ai-result.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="ec-panel ec-ai-result"
      aria-live="polite"
      aria-busy={busy}
    >
      <div className="ec-ai-section-heading">
        <h2 ref={heading} tabIndex={-1}>
          Kết quả phân tích
        </h2>
        {result && (
          <button type="button" className="ec-quiet" onClick={download}>
            <FiDownload aria-hidden="true" /> Tải JSON
          </button>
        )}
      </div>
      {busy ? (
        <div className="ec-ai-empty">
          <FiActivity aria-hidden="true" />
          <h3>Đang chờ mô hình phản hồi</h3>
          <p>Dữ liệu đang được gửi qua backend tới dịch vụ AI.</p>
        </div>
      ) : result ? (
        <>
          <p className="ec-ai-source">
            {result.source === "dataset"
              ? "Mẫu dataset thử nghiệm"
              : "Bộ đặc trưng do bạn cung cấp"}{" "}
            · {result.payload.point_id || "Chưa đặt mã điểm"}
          </p>
          <div
            className={`ec-ai-classification ${result.response.label === "Flood" ? "is-flood" : ""}`}
          >
            <span>Phân loại của mô hình</span>
            <h3>
              {result.response.label === "Flood"
                ? "Nhãn ngập"
                : "Nhãn không ngập"}
            </h3>
            <code>{result.response.label}</code>
          </div>
          <div className="ec-ai-score">
            <div>
              <span>Điểm xác suất lớp Flood</span>
              <strong>
                {(result.response.flood_probability * 100).toLocaleString(
                  "vi-VN",
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                )}
                %
              </strong>
            </div>
            <meter
              min="0"
              max="1"
              value={result.response.flood_probability}
              aria-label="Điểm xác suất lớp Flood"
            />
            <p>
              Điểm mô hình chưa được hiệu chỉnh thành xác suất ngập thực tế tại
              Đà Nẵng.
            </p>
          </div>
          <dl className="ec-ai-result-facts">
            <div>
              <dt>Đặc trưng đã điền khuyết</dt>
              <dd>
                {result.response.imputed_features?.join(", ") || "Không có"}
              </dd>
            </div>
            <div>
              <dt>Phiên bản mô hình</dt>
              <dd title={result.response.model_version}>
                {shortVersion(result.response.model_version)}
              </dd>
            </div>
            <div>
              <dt>Thời điểm chạy</dt>
              <dd>{new Date(result.at).toLocaleString("vi-VN")}</dd>
            </div>
          </dl>
          <p className="ec-ai-result-note">
            Kết quả này không xác nhận tình trạng ngập của một địa điểm và không
            dùng để chọn tuyến đường an toàn.
          </p>
        </>
      ) : (
        <div className="ec-ai-empty">
          <FiActivity aria-hidden="true" />
          <h3>Chưa có kết quả phân tích</h3>
          <p>
            Nạp mẫu, kiểm tra đầu vào và chọn Phân tích bằng mô hình. Kết quả sẽ
            xuất hiện tại đây sau khi AI phản hồi.
          </p>
          <ol>
            <li>Chuẩn bị đặc trưng từ nguồn</li>
            <li>Gửi đến mô hình qua backend</li>
            <li>Đối chiếu nhãn và phần điền khuyết</li>
          </ol>
        </div>
      )}
    </section>
  );
}
