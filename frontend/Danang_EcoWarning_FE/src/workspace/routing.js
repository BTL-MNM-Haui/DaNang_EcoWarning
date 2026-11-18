/**
 * Module hỗ trợ định tuyến và thuật toán phát hiện, né điểm sự cố
 */

// Bán kính vùng cảnh báo an toàn quanh điểm ngập/sự cố (mặc định 70 mét)
export const DEFAULT_AVOID_RADIUS_METERS = 200;

/* Tính khoảng cách xấp xỉ (mét) từ điểm P đến đoạn thẳng nối 2 điểm A và B */
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

/* Kiểm tra một tuyến đường xem có đi qua điểm sự cố nào không */
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

/* Gọi API TrackAsia để lấy các phương án lộ trình từ A->B */
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

/* Gọi TrackAsia đi qua 1 điểm trung gian (Waypoint) để bẻ hướng né ngập */
export async function fetchTrackAsiaRouteViaWaypoint(origin, waypoint, destination, apiKey) {
    const [oLon, oLat] = origin;
    const [wLon, wLat] = waypoint;
    const [dLon, dLat] = destination;
    const url = `https://maps.track-asia.com/route/v1/car/${oLon},${oLat};${wLon},${wLat};${dLon},${dLat}.json?geometries=geojson&overview=full&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) return null;
    return data.routes[0];
}

/* Thuật toán bẻ hướng né ngập: Thử tạo các waypoint dịch chuyển sang hai bên điểm ngập*/
export async function findDetourSafeRoute(origin, destination, primaryConflict, activeIncidents, apiKey, bufferMeters = DEFAULT_AVOID_RADIUS_METERS) {
    const [oLon, oLat] = origin;
    const [dLon, dLat] = destination;
    const iLon = primaryConflict.lon;
    const iLat = primaryConflict.lat;
    // Tính vector vuông góc với hướng đi để dời điểm tránh sang trái hoặc sang phải
    const rad = Math.PI / 180;
    const cosLat = Math.cos(iLat * rad);
    const dx = (dLon - oLon) * 111000 * cosLat;
    const dy = (dLat - oLat) * 111000;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    // Thử các độ lệch vuông góc: 350m và 650m sang hai bên
    const offsets = [350, -350, 650, -650];
    const candidates = [];
    for (const dist of offsets) {
        const wLon = iLon + (nx * dist) / (111000 * cosLat);
        const wLat = iLat + (ny * dist) / 111000;
        try {
            const route = await fetchTrackAsiaRouteViaWaypoint(origin, [wLon, wLat], destination, apiKey);
            if (!route) continue;
            const coords = route.geometry.coordinates;
            const conflicts = checkRouteConflicts(coords, activeIncidents, bufferMeters);
            candidates.push({
                distanceKm: (route.distance / 1000).toFixed(1),
                durationMin: Math.round(route.duration / 60),
                coordinates: coords,
                isSafe: conflicts.length === 0,
                conflicts,
                isDetour: true,
                detourAround: primaryConflict.address,
            });
        } catch {
            // bỏ qua nếu điểm dịch rơi vào vùng không có đường giao thông
        }
    }
    // Chọn tuyến né thành công (0 xung đột) có thời gian ngắn nhất
    const safeDetours = candidates.filter((r) => r.isSafe);
    if (safeDetours.length > 0) {
        safeDetours.sort((a, b) => a.durationMin - b.durationMin);
        return safeDetours[0];
    }
    return null;
}

/* Hàm điều phối chính: Tìm đường trực tiếp, nếu dính ngập thì tự động bẻ hướng né */
export async function findSafeRoutingPlan(origin, destination, incidents, apiKey, bufferMeters = DEFAULT_AVOID_RADIUS_METERS) {
    // Chỉ lấy sự cố ĐÃ XÁC MINH và ĐANG DIỄN RA (chưa RESOLVED)
    const activeVerified = incidents.filter(
        (item) => item.status === "VERIFIED" && item.incident_state !== "RESOLVED"
    );
    // 1. Lấy các tuyến trực tiếp từ TrackAsia
    const directRoutes = await fetchTrackAsiaRoutes(origin, destination, apiKey);
    const evaluated = directRoutes.map((route, index) => {
        const coords = route.geometry.coordinates;
        const conflicts = checkRouteConflicts(coords, activeVerified, bufferMeters);
        return {
            index,
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMin: Math.round(route.duration / 60),
            coordinates: coords,
            isSafe: conflicts.length === 0,
            conflicts,
            isDetour: false,
        };
    });
    // Tìm xem có tuyến trực tiếp nào an toàn không
    const safeDirect = evaluated.find((r) => r.isSafe);
    if (safeDirect) {
        return {
            safestRoute: safeDirect,
            activeIncidentCount: activeVerified.length,
        };
    }
    // 2. Nếu TẤT CẢ các đường trực tiếp đều dính ngập -> Kích hoạt thuật toán bẻ hướng né
    const primaryConflict = evaluated[0].conflicts[0];
    if (primaryConflict) {
        const detourRoute = await findDetourSafeRoute(origin, destination, primaryConflict, activeVerified, apiKey, bufferMeters);
        if (detourRoute) {
            return {
                safestRoute: detourRoute,
                activeIncidentCount: activeVerified.length,
            };
        }
    }
    // 3. Nếu khu vực bị cô lập hoàn toàn không thể né được -> trả về tuyến ít xung đột nhất
    evaluated.sort((a, b) => a.conflicts.length - b.conflicts.length || a.durationMin - b.durationMin);
    return {
        safestRoute: evaluated[0],
        activeIncidentCount: activeVerified.length,
    };
}