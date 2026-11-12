import { useResource } from "./useResource";
import { useEffect, useRef, useState } from "react";
import goong from "@goongmaps/goong-js";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiRefreshCw,
  FiMapPin,
  FiSliders,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";
import { reports, dataApi, unpack } from "./api";
import { Feedback, IncidentRow } from "./shared";

export function MapCanvas({
  items = [],
  onSelect,
  onPick,
  center,
  assetType = "",
}) {
  const container = useRef(null),
    map = useRef(null),
    markers = useRef([]),
    [error, setError] = useState("");
  const selectRef = useRef(onSelect),
    pickRef = useRef(onPick);
  selectRef.current = onSelect;
  pickRef.current = onPick;
  const key = import.meta.env.VITE_GOONG_MAP_TILES_KEY;
  useEffect(() => {
    if (!key) {
      setError(
        "Chưa cấu hình khóa bản đồ. Danh sách và tọa độ sự cố vẫn có thể tra cứu bên cạnh.",
      );
      return;
    }
    setError("Đang tải bản đồ…");
    goong.accessToken = key;
    try {
      const instance = new goong.Map({
        container: container.current,
        style: "https://tiles.goong.io/assets/goong_map_web.json",
        center: [108.2022, 16.0544],
        zoom: 11,
      });
      map.current = instance;
      instance.addControl(new goong.NavigationControl(), "bottom-right");
      instance.on("error", () =>
        setError(
          "Bản đồ chưa tải được. Hãy kiểm tra kết nối hoặc khóa bản đồ.",
        ),
      );
      instance.on("load", () => setError(""));
      instance.on("click", (event) =>
        pickRef.current?.({
          latitude: Number(event.lngLat.lat.toFixed(6)),
          longitude: Number(event.lngLat.lng.toFixed(6)),
        }),
      );
      const observer = new ResizeObserver(() => instance.resize());
      observer.observe(container.current);
      return () => {
        observer.disconnect();
        markers.current.forEach((m) => m.remove());
        instance.remove();
        map.current = null;
      };
    } catch {
      setError(
        "Trình duyệt chưa hỗ trợ hiển thị bản đồ. Hãy sử dụng danh sách và tọa độ.",
      );
    }
  }, [key]);
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    for (const item of items) {
      const lat = Number(item.latitude),
        lon = Number(item.longitude);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      )
        continue;
      const el = document.createElement("button");
      el.className = `ec-map-pin ${item.incident_state === "RESOLVED" ? "is-resolved" : ""} ${item.status === "PENDING" ? "is-pending" : ""}`;
      el.textContent = String(item.id);
      el.setAttribute(
        "aria-label",
        `${item.type_name || item.assetType || "Điểm dữ liệu"}: ${item.address_text || item.name || "xem chi tiết"}`,
      );
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        selectRef.current?.(item);
      });
      markers.current.push(
        new goong.Marker(el).setLngLat([lon, lat]).addTo(map.current),
      );
    }
  }, [items]);
  useEffect(() => {
    if (center && map.current)
      map.current.flyTo({
        center: [center.longitude, center.latitude],
        zoom: 14,
      });
  }, [center]);
  useEffect(() => {
    if (!assetType || !map.current) return;
    let active = true;
    const assetMarkers = [];
    dataApi
      .get("/asset/map", { params: { assetType } })
      .then(unpack)
      .then((items) => {
        if (!active) return;
        for (const item of items) {
          if (
            !Number.isFinite(Number(item.latitude)) ||
            !Number.isFinite(Number(item.longitude))
          )
            continue;
          const el = document.createElement("span");
          el.className = "ec-reference-pin";
          el.title = `${item.name} · Dữ liệu tham khảo`;
          const popup = new goong.Popup().setText(
            `${item.name} · ${item.assetType} · Dữ liệu tham khảo, không phản ánh sự cố hiện tại`,
          );
          assetMarkers.push(
            new goong.Marker(el)
              .setLngLat([Number(item.longitude), Number(item.latitude)])
              .setPopup(popup)
              .addTo(map.current),
          );
        }
      })
      .catch(() => setError("Chưa tải được lớp dữ liệu tham khảo."));
    return () => {
      active = false;
      assetMarkers.forEach((m) => m.remove());
    };
  }, [assetType]);
  return (
    <div className="ec-map-canvas">
      <div ref={container} className="ec-map-surface" />
      {error && (
        <p role="status" className="ec-map-warning">
          {error}
        </p>
      )}
    </div>
  );
}

export default function IncidentMap() {
  const [state, setState] = useState("ACTIVE"),
    [status, setStatus] = useState(""),
    [q, setQ] = useState(""),
    [hours, setHours] = useState(""),
    [depth, setDepth] = useState(""),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(null),
    [layer, setLayer] = useState("");
  const resource = useResource(
    () =>
      reports
        .get("/reports", {
          params: {
            state,
            status,
            q,
            size: 100,
            page,
            ...(hours
              ? {
                  since: new Date(
                    Date.now() - Number(hours) * 3600000,
                  ).toISOString(),
                }
              : {}),
            ...(depth ? { minDepth: depth } : {}),
          },
        })
        .then(unpack),
    [state, status, q, hours, depth, page],
  );
  const rows = resource.value?.items || [];
  function resetFilters() {
    setState("");
    setStatus("");
    setQ("");
    setHours("");
    setDepth("");
    setPage(0);
    setSelected(null);
  }
  return (
    <>
      <div className="ec-map-heading">
        <div>
          <h1>Bản đồ sự cố</h1>
          <p>Theo dõi tình hình qua báo cáo cộng đồng tại Đà Nẵng.</p>
        </div>
        <Link className="ec-button" to="/report">
          <FiPlus />
          Báo cáo sự cố
        </Link>
      </div>
      <div className="ec-map-workspace">
        <section className="ec-map-list" aria-label="Danh sách sự cố">
          <div className="ec-map-tools">
            <h2 className="ec-map-list-title">Báo cáo cộng đồng</h2>
            <label>
              Tìm địa chỉ hoặc mô tả
              <input
                type="search"
                value={q}
                placeholder="Tìm khu vực…"
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <div className="ec-filter-grid">
              <label>
                Diễn biến
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="ACTIVE">Đang diễn ra</option>
                  <option value="RESOLVED">Đã kết thúc</option>
                  <option value="UNKNOWN">Chưa rõ</option>
                </select>
              </label>
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
                  <option value="VERIFIED">Đã xác minh</option>
                  <option value="PENDING">Chờ xác minh</option>
                </select>
              </label>
            </div>
            <details className="ec-advanced-filters">
              <summary>
                <FiSliders aria-hidden="true" /> Bộ lọc thêm
                {(hours || depth) && <span>Đang áp dụng</span>}
                <FiChevronDown
                  className="ec-disclosure-arrow"
                  aria-hidden="true"
                />
              </summary>
              <div className="ec-filter-grid">
                <label>
                  Cập nhật trong
                  <select
                    value={hours}
                    onChange={(e) => {
                      setHours(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">Mọi thời điểm</option>
                    <option value="24">24 giờ</option>
                    <option value="168">7 ngày</option>
                  </select>
                </label>
                <label>
                  Độ ngập ước tính
                  <select
                    value={depth}
                    onChange={(e) => {
                      setDepth(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="">Mọi mức</option>
                    <option value="20">Từ 20 cm</option>
                    <option value="50">Từ 50 cm</option>
                  </select>
                </label>
              </div>
            </details>
            <div className="ec-list-caption">
              <span>{resource.value?.total ?? "—"} sự cố phù hợp</span>
              <button
                className="ec-icon-button"
                aria-label="Tải lại sự cố"
                onClick={resource.reload}
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
          <Feedback
            resource={resource}
            empty={!rows.length}
            emptyContent={
              <div className="ec-map-empty">
                <FiSearch aria-hidden="true" />
                <h3>Chưa có báo cáo phù hợp</h3>
                <p>
                  Thử mở rộng điều kiện tìm kiếm. Không có báo cáo không có
                  nghĩa là khu vực an toàn.
                </p>
                {(state || status || q || hours || depth) && (
                  <button
                    className="ec-button ec-secondary"
                    onClick={resetFilters}
                  >
                    Xem tất cả báo cáo
                  </button>
                )}
                <Link className="ec-empty-report" to="/report">
                  Bạn thấy sự cố? Gửi báo cáo <FiPlus aria-hidden="true" />
                </Link>
              </div>
            }
          >
            {rows.map((row) => (
              <IncidentRow
                key={row.id}
                report={row}
                selected={selected?.id === row.id}
                onSelect={setSelected}
              />
            ))}
          </Feedback>
          {(resource.value?.total || 0) > 100 && (
            <div className="ec-pagination">
              <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <span>Trang {page + 1}</span>
              <button
                disabled={(page + 1) * 100 >= (resource.value?.total || 0)}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </section>
        <section className="ec-map-stage" aria-label="Bản đồ Đà Nẵng">
          <MapCanvas
            items={rows}
            onSelect={setSelected}
            center={selected}
            assetType={layer}
          />
          <label className="ec-map-layer">
            Lớp dữ liệu tham khảo
            <select value={layer} onChange={(e) => setLayer(e.target.value)}>
              <option value="">Chỉ báo cáo cộng đồng</option>
              {[
                "Nhà Trú Bão",
                "Trạm Đo Mưa",
                "Khu Vực Sạt Lở",
                "Hồ Thủy Lợi",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          {layer && (
            <div className="ec-reference-layer">
              <ReferenceLayer type={layer} />
            </div>
          )}
          <div className="ec-map-legend">
            <span>
              <i />
              Đang diễn ra
            </span>
            <span>
              <i className="is-pending" />
              Chờ xác minh
            </span>
            <span>
              <i className="is-resolved" />
              Đã kết thúc
            </span>
          </div>
          {selected && (
            <div className="ec-map-detail">
              <button
                className="ec-close"
                onClick={() => setSelected(null)}
                aria-label="Đóng chi tiết"
              >
                ×
              </button>
              <IncidentRow report={selected} />
              <Link
                className="ec-button ec-secondary"
                to={`/incidents/${selected.id}`}
              >
                Xem diễn biến & đóng góp
              </Link>
            </div>
          )}
          <p className="ec-map-disclaimer">
            <FiMapPin />
            Báo cáo có thể chưa được xác minh. Kiểm tra thời điểm cập nhật trước
            khi sử dụng.
          </p>
        </section>
      </div>
    </>
  );
}
function ReferenceLayer({ type }) {
  const resource = useResource(
    () =>
      dataApi.get("/asset/map", { params: { assetType: type } }).then(unpack),
    [type],
  );
  return (
    <Feedback resource={resource}>
      <p>
        {resource.value?.length ?? 0} điểm tham khảo · Không phải sự cố hiện tại
      </p>
      <Link to="/data">Tra cứu dữ liệu</Link>
    </Feedback>
  );
}
