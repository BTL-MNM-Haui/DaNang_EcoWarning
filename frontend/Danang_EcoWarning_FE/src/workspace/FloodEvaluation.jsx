import { useEffect, useRef, useState } from "react";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { dataApi, message, unpack } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./shared";

const descriptions = {
  gini: "Mức quan trọng theo các lần chia nhánh trong Random Forest của notebook.",
  permutation:
    "Mức giảm F1-macro khi xáo trộn từng đặc trưng trên tập validation.",
  ablation:
    "Mức thay đổi F1-macro sau khi bỏ từng đặc trưng và huấn luyện lại trên tập fit.",
  shap: "Trung bình trị tuyệt đối SHAP trên mẫu validation; không phải giải thích cho điểm vừa dự đoán.",
};

export default function FloodEvaluation({ canRun, modelVersion }) {
  const report = useResource(
    () =>
      canRun
        ? dataApi.get("/ai/flood/evaluation").then(unpack)
        : Promise.resolve(null),
    [canRun],
  );
  const [selected, setSelected] = useState("gini");
  if (!canRun)
    return (
      <section className="ec-panel ec-ai-evaluation">
        <h2>Đánh giá mô hình</h2>
        <p>
          Đăng nhập bằng tài khoản quản lý để xem mức ảnh hưởng của 9 đặc trưng
          và các biểu đồ notebook qua dịch vụ AI.
        </p>
        <p>
          Báo cáo gồm Gini, Permutation, Ablation và SHAP. Điểm xếp hạng trong
          notebook không phải độ chính xác dự báo.
        </p>
      </section>
    );
  const data = report.value;
  const values = data?.global_importance?.values || [];
  const notebook = data?.notebook_report;
  const rows = [...values].sort((a, b) => b.importance - a.importance);
  const available = notebook?.status === "available";
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecowarning-model-evaluation.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="ec-ai-evaluation" aria-label="Đánh giá mô hình">
      <header className="ec-ai-evaluation-heading">
        <div>
          <h2>Đánh giá mô hình</h2>
          <p>
            Tách thông tin của model đang phục vụ khỏi kết quả thí nghiệm trong
            notebook.
          </p>
        </div>
        <button type="button" onClick={report.reload} disabled={report.loading}>
          <FiRefreshCw aria-hidden="true" /> Tải lại báo cáo
        </button>
      </header>
      <Feedback resource={report}>
        {data && modelVersion && data.model_version !== modelVersion ? (
          <p className="ec-error" role="alert">
            Phiên bản báo cáo khác model đã kết nối. Hãy kết nối lại mô hình và
            tải lại báo cáo trước khi đối chiếu.
          </p>
        ) : (
          data && (
            <>
              <section className="ec-panel ec-ai-live-importance">
                <div className="ec-ai-section-heading">
                  <div>
                    <h3>Gini của model đang chạy</h3>
                    <p>
                      Trọng số được đọc trực tiếp từ artifact đang dùng để dự
                      đoán.
                    </p>
                  </div>
                  <button type="button" onClick={download}>
                    <FiDownload aria-hidden="true" /> Tải báo cáo JSON
                  </button>
                </div>
                <p className="ec-ai-evaluation-explainer">
                  Đây là mức quan trọng toàn cục của đặc trưng, không phải độ
                  chính xác và không giải thích riêng một điểm. Trọng số Gini có
                  thể thiên lệch theo kiểu dữ liệu.
                </p>
                <div
                  className="ec-ai-importance-table"
                  role="table"
                  aria-label="Trọng số Gini của model đang chạy"
                >
                  <div role="row" className="ec-ai-importance-header">
                    <span role="columnheader">Đặc trưng</span>
                    <span role="columnheader">Trọng số Gini</span>
                  </div>
                  {rows.map((row) => (
                    <div role="row" key={row.feature}>
                      <span role="cell">{row.feature}</span>
                      <span role="cell">
                        <span
                          className="ec-ai-importance-track"
                          aria-hidden="true"
                        >
                          <span style={{ width: `${row.importance * 100}%` }} />
                        </span>
                        <strong>
                          {(row.importance * 100).toLocaleString("vi-VN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          %
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="ec-ai-source">
                  Phiên bản:{" "}
                  <code title={data.model_version}>
                    {data.model_version?.slice(0, 19)}…
                  </code>
                  . Tổng trọng số được chuẩn hóa về 1; model không có phép chia
                  có thể trả toàn bộ 0.
                </p>
              </section>
              <section className="ec-panel ec-ai-notebook-evaluation">
                <h3>Báo cáo từ notebook của nhóm AI</h3>
                <p className="ec-ai-evaluation-warning">
                  Các biểu đồ dưới đây quy đổi thứ hạng về khoảng 90–95. Đó là
                  điểm xếp hạng để trình bày, không phải độ chính xác 90–95% hay
                  trọng số Gini ở trên.
                </p>
                <p>
                  Notebook dùng model huấn luyện lại trên tập fit để đánh giá
                  với tập validation. Chưa có fingerprint liên kết model đó với
                  artifact đang phục vụ; không dùng các biểu đồ này làm giải
                  thích cho dự đoán vừa chạy.
                </p>
                {!available ? (
                  <p role="status">
                    Chưa có báo cáo notebook hợp lệ hoặc notebook đã thay đổi
                    sau khi xuất. Gini của model đang chạy vẫn được hiển thị
                    riêng.
                  </p>
                ) : (
                  <>
                    <div
                      className="ec-ai-methods"
                      role="group"
                      aria-label="Phương pháp đánh giá notebook"
                    >
                      {notebook.methods.map((method) => (
                        <button
                          type="button"
                          key={method.id}
                          aria-pressed={selected === method.id}
                          onClick={() => setSelected(method.id)}
                        >
                          {method.title}
                        </button>
                      ))}
                    </div>
                    <p className="ec-ai-method-description">
                      {descriptions[selected]}
                    </p>
                    <NotebookChart
                      chartId={selected}
                      notebookHash={notebook.notebook_sha256}
                      title={
                        notebook.methods.find((m) => m.id === selected)?.title
                      }
                    />
                    <p className="ec-ai-source">
                      Ảnh lấy nguyên trạng từ output đã lưu của notebook. Bản
                      này chưa xuất bảng số gốc cho bốn phương pháp; không suy
                      ngược số gốc từ điểm quy đổi.
                    </p>
                    <details className="ec-ai-report-provenance">
                      <summary>Nguồn và cách quy đổi</summary>
                      <dl>
                        <dt>Notebook</dt>
                        <dd>{notebook.source_notebook}</dd>
                        <dt>SHA-256 notebook</dt>
                        <dd>{notebook.notebook_sha256}</dd>
                        <dt>Công thức điểm xếp hạng</dt>
                        <dd>
                          <code>{notebook.converted_score.formula}</code>
                        </dd>
                        <dt>Liên kết với model đang chạy</dt>
                        <dd>Chưa được xác minh</dd>
                      </dl>
                    </details>
                  </>
                )}
              </section>
            </>
          )
        )}
      </Feedback>
    </section>
  );
}

function NotebookChart({ chartId, notebookHash, title }) {
  const dialog = useRef(null);
  const chartKey = `${notebookHash}:${chartId}`;
  const [chart, setChart] = useState({
    key: "",
    loading: true,
    url: "",
    error: "",
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true,
      objectUrl;
    const controller = new AbortController();
    setChart({ key: chartKey, loading: true, url: "", error: "" });
    dataApi
      .get(`/ai/flood/evaluation/charts/${chartId}`, {
        responseType: "blob",
        signal: controller.signal,
      })
      .then((response) => {
        if (!active) return;
        if (response.data.type !== "image/png")
          throw Error("Phản hồi không phải ảnh PNG.");
        objectUrl = URL.createObjectURL(response.data);
        setChart({ key: chartKey, loading: false, url: objectUrl, error: "" });
      })
      .catch((error) => {
        if (active)
          setChart({
            key: chartKey,
            loading: false,
            url: "",
            error: error.response ? message(error) : error.message,
          });
      });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [chartId, chartKey, revision]);
  return (
    <figure className="ec-ai-notebook-chart">
      {chart.loading || chart.key !== chartKey ? (
        <p role="status">Đang tải biểu đồ {title}…</p>
      ) : chart.error ? (
        <div role="alert">
          <p>Chưa tải được biểu đồ. {chart.error}</p>
          <button type="button" onClick={() => setRevision((v) => v + 1)}>
            Thử lại biểu đồ
          </button>
        </div>
      ) : (
        <>
          <img
            src={chart.url}
            alt={`${title}: điểm xếp hạng đặc trưng từ notebook, không phải độ chính xác`}
          />
          <figcaption>
            <span>{title} · snapshot notebook</span>
            <button type="button" onClick={() => dialog.current.showModal()}>
              Phóng to biểu đồ
            </button>
            <a href={chart.url} download={`notebook-${chartId}.png`}>
              Tải ảnh gốc
            </a>
          </figcaption>
          <dialog
            ref={dialog}
            className="ec-ai-chart-dialog"
            aria-label={`${title} phóng to`}
          >
            <div>
              <strong>{title}</strong>
              <button type="button" onClick={() => dialog.current.close()}>
                Đóng biểu đồ
              </button>
            </div>
            <p>
              Điểm xếp hạng notebook, không phải độ chính xác. Cuộn ngang để đọc
              đầy đủ nhãn trên màn hình nhỏ.
            </p>
            <div className="ec-ai-chart-scroll">
              <img src={chart.url} alt={`${title} kích thước lớn`} />
            </div>
          </dialog>
        </>
      )}
    </figure>
  );
}
