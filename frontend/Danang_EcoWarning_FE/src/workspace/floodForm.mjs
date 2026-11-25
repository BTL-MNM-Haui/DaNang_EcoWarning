export const featureGroups = [
  {
    title: "Vị trí trong dữ liệu nguồn",
    fields: [
      ["X", "Tọa độ X"],
      ["Y", "Tọa độ Y"],
    ],
  },
  {
    title: "Đặc trưng địa hình",
    fields: [
      ["Slope", "Độ dốc"],
      ["Curvature", "Độ cong địa hình"],
      ["Aspect", "Hướng địa hình"],
    ],
  },
  {
    title: "Thủy văn và lượng mưa",
    fields: [
      ["TWI", "Chỉ số ẩm địa hình"],
      ["FA", "Tích lũy dòng chảy"],
      ["Drainage", "Đặc trưng thoát nước"],
      ["Rainfall", "Lượng mưa"],
    ],
  },
];
export const featureNames = featureGroups.flatMap((g) =>
  g.fields.map(([key]) => key),
);
export const blankFeatures = () =>
  Object.fromEntries(featureNames.map((key) => [key, ""]));
export const isMissing = (v) => v === null || v === -9999 || v <= -1e30;
export function makeFloodPayload(values, pointId = "") {
  const features = Object.fromEntries(
    featureNames.map((key) => {
      const raw = values[key];
      const value =
        raw === "" || raw === null || raw === undefined ? null : Number(raw);
      if (
        value !== null &&
        (!Number.isFinite(value) || value > 3.4028234663852886e38)
      )
        throw Error(
          `${key}: cần nhập số hữu hạn nằm trong giới hạn của mô hình.`,
        );
      return [key, value];
    }),
  );
  if (Object.values(features).every(isMissing))
    throw Error(
      "Cần ít nhất một đặc trưng có giá trị. Bạn có thể nạp mẫu để thử.",
    );
  if (pointId.length > 128)
    throw Error("Mã điểm không được dài quá 128 ký tự.");
  return { point_id: pointId.trim() || null, features };
}
export function readFloodJson(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw Error("JSON chưa hợp lệ. Hãy kiểm tra dấu ngoặc và dấu phẩy.");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.keys(payload).some((k) => !["point_id", "features"].includes(k)) ||
    !payload.features ||
    Array.isArray(payload.features) ||
    Object.keys(payload.features).length !== featureNames.length ||
    featureNames.some((k) => !Object.hasOwn(payload.features, k))
  )
    throw Error(
      "JSON phải có features gồm đúng 9 trường X, Y, Slope, Curvature, Aspect, TWI, FA, Drainage, Rainfall.",
    );
  if (payload.point_id != null && typeof payload.point_id !== "string")
    throw Error("point_id phải là chuỗi hoặc null.");
  if (
    Object.values(payload.features).some(
      (v) => v !== null && typeof v !== "number",
    )
  )
    throw Error("Giá trị đặc trưng trong JSON phải là số hoặc null.");
  return makeFloodPayload(payload.features, payload.point_id || "");
}
