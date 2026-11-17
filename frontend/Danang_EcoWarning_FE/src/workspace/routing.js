/**
 * Module hỗ trợ định tuyến và thuật toán phát hiện, né điểm sự cố
 */

// Bán kính vùng cảnh báo an toàn quanh điểm ngập/sự cố (mặc định 70 mét)
export const DEFAULT_AVOID_RADIUS_METERS = 70;

/**
 * Tính khoảng cách xấp xỉ (mét) từ điểm P đến đoạn thẳng nối 2 điểm A và B
 * p, a, b đều có dạng [longitude, latitude]
 */
export function distanceToSegment(p, a, b) {
    const rad = Math.PI / 180;
    const cosLat = Math.cos((a[1] * rad));
    // Quy đổi độ kinh vĩ sang tọa độ phẳng cục bộ (mét)
    const x = (b[0] - a[0]) * rad * 6371000 * cosLat;
    const y = (b[1] - a[1]) * rad * 6371000;
    const px = (p[0] - a[0]) * rad * 6371000 * cosLat;
    const py = (p[1] - a[1]) * rad * 6371000;

    const lenSq = x * x + y * y;
    if (lenSq === 0) return Math.hypot(px, py);

    let t = (px * x + py * y) / lenSq;
    t = Math.max(0, Math.min(1, t)); // giới hạn chiếu trong đoạn thẳng [0, 1]

    const projX = t * x;
    const projY = t * y;
    return Math.hypot(px - projX, py - projY);
}

/**
 * Kiểm tra một tuyến đường (gồm danh sách tọa độ coordinates) xem có đi qua điểm sự cố nào không
 */
export function checkRouteConflicts(coordinates, activeIncidents, bufferMeters = DEFAULT_AVOID_RADIUS_METERS) {
    const conflicts = [];

    for (const incident of activeIncidents) {
        const lat = Number(incident.latitude);
        const lon = Number(incident.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

        const p = [lon, lat];
        let isNear = false;

        // Quét từng đoạn đường nhỏ cấu thành lộ trình
        for (let i = 0; i < coordinates.length - 1; i++) {
            const a = coordinates[i];
            const b = coordinates[i + 1];
            const dist = distanceToSegment(p, a, b);

            if (dist <= bufferMeters) {
                isNear = true;
                break;
            }
        }

        if (isNear) {
            conflicts.push({
                id: incident.id,
                address: incident.address_text || incident.name || "Điểm sự cố",
                type: incident.type_name || incident.report_type || "Sự cố",
                lat,
                lon,
            });
        }
    }

    return conflicts;
}

/**
 * Gọi API TrackAsia để lấy các phương án lộ trình từ origin -> destination
 * origin, destination: [longitude, latitude]
 */
export async function fetchTrackAsiaRoutes(origin, destination, apiKey) {
    const [oLon, oLat] = origin;
    const [dLon, dLat] = destination;
    const url = `https://maps.track-asia.com/route/v1/car/${oLon},${oLat};${dLon},${dLat}.json?alternatives=true&geometries=geojson&overview=full&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Lỗi kết nối dịch vụ định tuyến TrackAsia (${response.status})`);
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("Không tìm thấy tuyến đường khả dụng giữa 2 điểm này.");
    }

    return data.routes;
}

/**
 * Thuật toán đánh giá và sắp xếp các tuyến đường theo độ an toàn
 */
export function evaluateSafeRoutes(routes, incidents, bufferMeters = DEFAULT_AVOID_RADIUS_METERS) {
    // Chỉ lọc những sự cố ĐÃ XÁC MINH (VERIFIED) và CHƯA KẾT THÚC (khác RESOLVED)
    const activeVerified = incidents.filter(
        (item) => item.status === "VERIFIED" && item.incident_state !== "RESOLVED"
    );

    const evaluated = routes.map((route, index) => {
        const coords = route.geometry.coordinates;
        const conflicts = checkRouteConflicts(coords, activeVerified, bufferMeters);

        return {
            index,
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.round(route.duration / 60),
            coordinates: coords,
            isSafe: conflicts.length === 0,
            conflicts,
            originalRoute: route,
        };
    });

    // Ưu tiên: Tuyến an toàn nhất (0 xung đột) lên đầu, sau đó đến tuyến ngắn nhất
    evaluated.sort((a, b) => {
        if (a.isSafe && !b.isSafe) return -1;
        if (!a.isSafe && b.isSafe) return 1;
        if (a.conflicts.length !== b.conflicts.length) return a.conflicts.length - b.conflicts.length;
        return a.durationMin - b.durationMin;
    });

    return {
        routes: evaluated,
        safestRoute: evaluated[0],
        activeIncidentCount: activeVerified.length,
    };
}