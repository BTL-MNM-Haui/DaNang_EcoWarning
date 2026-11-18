import { useResource } from "./useResource";
import { useEffect, useRef, useState } from "react";
// import goong from "@goongmaps/goong-js";
import trackasia from "trackasia-gl";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiRefreshCw,
  FiMapPin,
  FiSliders,
  FiChevronDown,
  FiSearch,
  FiNavigation,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { reports, dataApi, unpack } from "./api";
import { Feedback, IncidentRow } from "./shared";
import { findSafeRoutingPlan } from "./routing";

export function MapCanvas({
  items = [],
  onSelect,
  onPick,
  center,
  assetType = "",
  route = null,
  origin = null,
  destination = null,
}) {
  const container = useRef(null),
    map = useRef(null),
    markers = useRef([]),
    markerARef = useRef(null),
    markerBRef = useRef(null),
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
    // goong.accessToken = key;
    try {
      // const instance = new goong.Map({
      //   container: container.current,
      //   style: "https://tiles.goong.io/assets/goong_map_web.json",
      //   center: [108.2022, 16.0544],
      //   zoom: 11,
      // });
      const instance = new trackasia.Map({
        container: container.current,
        style: `https://maps.track-asia.com/styles/v2/streets.json?key=${key}`,
        center: [108.2022, 16.0544],
        zoom: 12,
      });
      map.current = instance;
      instance.addControl(new trackasia.NavigationControl(), "bottom-right");
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
      // Resize the WebGL buffer once the surrounding layout settles, rather
      // than rebuilding it on every frame of the navigation transition.
      let resizeTimer;
      const observer = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => instance.resize(), 100);
      });
      observer.observe(container.current);
      return () => {
        observer.disconnect();
        clearTimeout(resizeTimer);
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
        new trackasia.Marker({ element: el }).setLngLat([lon, lat]).addTo(map.current),
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

  // Hiển thị ghim A ngay lập tức khi chọn điểm xuất phát
  useEffect(() => {
    if (!map.current) return;
    if (origin) {
      if (!markerARef.current) {
        const elA = document.createElement("div");
        elA.className = "ec-route-pin is-start";
        elA.textContent = "A";
        markerARef.current = new trackasia.Marker({ element: elA })
          .setLngLat(origin)
          .addTo(map.current);
      } else {
        markerARef.current.setLngLat(origin);
      }
    } else if (markerARef.current) {
      markerARef.current.remove();
      markerARef.current = null;
    }
  }, [origin]);

  // Hiển thị ghim B ngay lập tức khi chọn điểm đến
  useEffect(() => {
    if (!map.current) return;
    if (destination) {
      if (!markerBRef.current) {
        const elB = document.createElement("div");
        elB.className = "ec-route-pin is-end";
        elB.textContent = "B";
        markerBRef.current = new trackasia.Marker({ element: elB })
          .setLngLat(destination)
          .addTo(map.current);
      } else {
        markerBRef.current.setLngLat(destination);
      }
    } else if (markerBRef.current) {
      markerBRef.current.remove();
      markerBRef.current = null;
    }
  }, [destination]);

  // Hiển thị tuyến đường và các ghim A/B
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    // Nếu không có route (hoặc bấm Hủy), xóa lớp vẽ đường
    if (!route || !route.coordinates || route.coordinates.length === 0) {
      if (m.getSource("safe-route-source")) {
        m.getSource("safe-route-source").setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      return;
    }

    const { coordinates, isSafe, origin, destination } = route;
    const color = isSafe ? "#059669" : "#dc2626";

    const geojsonData = {
      type: "Feature",
      properties: { color },
      geometry: {
        type: "LineString",
        coordinates,
      },
    };

    // Kiểm tra và cập nhật hoặc tạo mới Source/Layer trên TrackAsia
    if (m.getSource("safe-route-source")) {
      m.getSource("safe-route-source").setData(geojsonData);
      m.setPaintProperty("safe-route-line", "line-color", color);
    } else {
      m.addSource("safe-route-source", {
        type: "geojson",
        data: geojsonData,
      });

      // Viền trắng ngoài giúp đường nổi bật trên nền bản đồ
      m.addLayer({
        id: "safe-route-casing",
        type: "line",
        source: "safe-route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.9,
        },
      });

      // Lớp màu chính của lộ trình
      m.addLayer({
        id: "safe-route-line",
        type: "line",
        source: "safe-route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": color,
          "line-width": 5,
        },
      });
    }

    // // Ghim Điểm xuất phát A
    // if (origin) {
    //   const elA = document.createElement("div");
    //   elA.className = "ec-route-pin is-start";
    //   elA.textContent = "A";
    //   const markerA = new trackasia.Marker({ element: elA })
    //     .setLngLat(origin)
    //     .addTo(m);
    //   routeMarkers.current.push(markerA);
    // }

    // // Ghim Điểm đến B
    // if (destination) {
    //   const elB = document.createElement("div");
    //   elB.className = "ec-route-pin is-end";
    //   elB.textContent = "B";
    //   const markerB = new trackasia.Marker({ element: elB })
    //     .setLngLat(destination)
    //     .addTo(m);
    //   routeMarkers.current.push(markerB);
    // }

    // Tự động zoom và căn chỉnh bản đồ vừa khít toàn bộ tuyến đường
    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord),
      new trackasia.LngLatBounds(coordinates[0], coordinates[0])
    );
    m.fitBounds(bounds, { padding: { top: 70, bottom: 70, left: 70, right: 70 } });
  }, [route]);

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
          const popup = new trackasia.Popup().setText(
            `${item.name} · ${item.assetType} · Dữ liệu tham khảo, không phản ánh sự cố hiện tại`,
          );
          assetMarkers.push(
            new trackasia.Marker({ element: el })
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
    [layer, setLayer] = useState(""),
    [mobileView, setMobileView] = useState("map");

  // --- Quản lý trạng thái chỉ đường né ngập ---
  const [routePanelOpen, setRoutePanelOpen] = useState(false);
  const [origin, setOrigin] = useState(null); // [lon, lat]
  const [destination, setDestination] = useState(null); // [lon, lat]
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [pickingTarget, setPickingTarget] = useState(null); // 'origin' | 'destination' | null
  const [routeResult, setRouteResult] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routingError, setRoutingError] = useState("");
  const mapApiKey = import.meta.env.VITE_GOONG_MAP_TILES_KEY;

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

  // Lấy vị trí GPS hiện tại của người dùng
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setRoutingError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setRoutingError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setOrigin(coords);
        setOriginText("Vị trí của tôi");
        setPickingTarget(null);
      },
      () => setRoutingError("Chưa lấy được vị trí GPS. Hãy kiểm tra quyền truy cập vị trí.")
    );
  }
  // Khi click trên bản đồ
  function handleMapClick(coords) {
    if (pickingTarget === "origin") {
      setOrigin([coords.longitude, coords.latitude]);
      setOriginText(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      setPickingTarget(null);
    } else if (pickingTarget === "destination") {
      setDestination([coords.longitude, coords.latitude]);
      setDestinationText(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      setPickingTarget(null);
    }
  }
  // Gọi thuật toán tìm tuyến an toàn
  async function handleFindSafeRoute() {
    if (!origin || !destination) {
      setRoutingError("Vui lòng chọn cả điểm xuất phát (A) và điểm đến (B).");
      return;
    }
    setRoutingLoading(true);
    setRoutingError("");
    try {
      const plan = await findSafeRoutingPlan(origin, destination, rows, mapApiKey);
      setRouteResult(plan);
    } catch (err) {
      setRoutingError(err.message || "Không thể tìm tuyến đường.");
      setRouteResult(null);
    } finally {
      setRoutingLoading(false);
    }
  }
  // Xóa / Đóng chỉ đường
  function handleCloseRouting() {
    setRoutePanelOpen(false);
    setRouteResult(null);
    setOrigin(null);
    setDestination(null);
    setOriginText("");
    setDestinationText("");
    setPickingTarget(null);
    setRoutingError("");
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
      <div className="ec-view-switch" role="group" aria-label="Cách xem sự cố">
        <button
          aria-pressed={mobileView === "map"}
          onClick={() => setMobileView("map")}
        >
          Bản đồ
        </button>
        <button
          aria-pressed={mobileView === "list"}
          onClick={() => setMobileView("list")}
        >
          Danh sách{resource.value ? ` (${resource.value.total})` : ""}
        </button>
      </div>
      <div className={`ec-map-workspace is-${mobileView}`}>
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
            onPick={handleMapClick}
            center={selected}
            assetType={layer}
            origin={origin}
            destination={destination}
            route={
              routeResult?.safestRoute
                ? {
                  coordinates: routeResult.safestRoute.coordinates,
                  isSafe: routeResult.safestRoute.isSafe,
                  // origin,
                  // destination,
                }
                : null
            }
          />

          {/* Nút bấm mở panel Chỉ đường */}
          {!routePanelOpen && (
            <button
              className="ec-route-open-button"
              onClick={() => setRoutePanelOpen(true)}
              type="button"
            >
              <FiNavigation aria-hidden="true" />
              Chỉ đường né ngập
            </button>
          )}

          {/* Panel điều khiển chỉ đường né sự cố */}
          {routePanelOpen && (
            <div className="ec-route-panel" role="region" aria-label="Chỉ đường">
              <div className="ec-route-header">
                <h3>
                  <FiNavigation aria-hidden="true" /> Chỉ đường né sự cố
                </h3>
                <button
                  className="ec-close"
                  onClick={handleCloseRouting}
                  aria-label="Đóng chỉ đường"
                  type="button"
                >
                  <FiX />
                </button>
              </div>

              <div className="ec-route-inputs">
                {/* Điểm xuất phát A */}
                <div className="ec-route-input-group">
                  <span className="ec-route-badge is-start">A</span>
                  <input
                    type="text"
                    readOnly
                    placeholder="Điểm xuất phát…"
                    value={originText}
                  />
                  <button
                    type="button"
                    className={`ec-route-action-btn ${pickingTarget === "origin" ? "is-picking" : ""}`}
                    onClick={() => setPickingTarget(pickingTarget === "origin" ? null : "origin")}
                    title="Bấm để chọn vị trí trên bản đồ"
                  >
                    {pickingTarget === "origin" ? "Chạm bản đồ" : "Chọn trên bản đồ"}
                  </button>
                </div>

                <div className="ec-route-subaction">
                  <button type="button" onClick={useCurrentLocation}>
                    📍 Dùng vị trí hiện tại của tôi
                  </button>
                </div>

                {/* Điểm đến B */}
                <div className="ec-route-input-group">
                  <span className="ec-route-badge is-end">B</span>
                  <input
                    type="text"
                    readOnly
                    placeholder="Điểm đến…"
                    value={destinationText}
                  />
                  <button
                    type="button"
                    className={`ec-route-action-btn ${pickingTarget === "destination" ? "is-picking" : ""}`}
                    onClick={() => setPickingTarget(pickingTarget === "destination" ? null : "destination")}
                    title="Bấm để chọn vị trí trên bản đồ"
                  >
                    {pickingTarget === "destination" ? "Chạm bản đồ" : "Chọn trên bản đồ"}
                  </button>
                </div>
              </div>

              {routingError && <p className="ec-route-error">{routingError}</p>}

              <button
                type="button"
                className="ec-button ec-route-submit"
                disabled={routingLoading || !origin || !destination}
                onClick={handleFindSafeRoute}
              >
                {routingLoading ? "Đang quét tuyến an toàn…" : "Tìm tuyến đường an toàn"}
              </button>

              {/* Kết quả tuyến đường */}
              {routeResult && (
                <div className="ec-route-result">
                  <div className="ec-route-result-meta">
                    <strong>{routeResult.safestRoute.distanceKm} km</strong>
                    <span>Khoảng {routeResult.safestRoute.durationMin} phút</span>
                  </div>

                  {routeResult.safestRoute.isSafe ? (
                    <div className="ec-route-alert is-safe">
                      <FiCheckCircle aria-hidden="true" />
                      <div>
                        <strong>Tuyến đường an toàn</strong>
                        {/* <p>Đã né hoàn toàn các điểm sự cố/ngập úng đang diễn ra.</p> */}
                        <p>
                          {routeResult.safestRoute.isDetour
                            ? `Đã tự động chuyển hướng tại: ${routeResult.safestRoute.detourAround}.`
                            : "Đã né hoàn toàn các điểm sự cố đang diễn ra."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="ec-route-alert is-warning">
                      <FiAlertTriangle aria-hidden="true" />
                      <div>
                        <strong>Lưu ý: Có điểm ngập trên đường</strong>
                        <p>
                          Đi qua {routeResult.safestRoute.conflicts.length} điểm sự cố tại:{" "}
                          {routeResult.safestRoute.conflicts.map((c) => c.address).join(", ")}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
