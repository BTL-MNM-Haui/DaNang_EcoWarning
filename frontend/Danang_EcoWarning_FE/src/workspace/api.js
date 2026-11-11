import axios from "axios";

let refreshing;
const authBase = "/backend/auth/api/v1";
export const session = axios.create({ baseURL: authBase, timeout: 20000 });
export const reports = axios.create({
  baseURL: "/backend/reports/api/v1",
  timeout: 35000,
});
export const dataApi = axios.create({
  baseURL: "/backend/data/api/v1",
  timeout: 20000,
});
export const collector = axios.create({
  baseURL: "/backend/collector/api/v1",
  timeout: 35000,
});

export const unpack = (response) =>
  response.data?.status === "SUCCESS" ? response.data.data : response.data;
export function message(error) {
  const value = error.response?.data?.message || error.response?.data?.data;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return Object.values(value).join(" ");
  return error.code === "ECONNABORTED"
    ? "Yêu cầu quá thời gian chờ. Nội dung vẫn được giữ, hãy thử lại."
    : "Chưa kết nối được máy chủ. Hãy kiểm tra kết nối rồi thử lại.";
}
for (const client of [session, reports, dataApi, collector]) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token && !config.headers.Authorization)
      config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (
        error.response?.status !== 401 ||
        config?._retry ||
        config?.url?.startsWith("/auth/")
      )
        return Promise.reject(error);
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(error);
      config._retry = true;
      try {
        refreshing ||= axios
          .post(`${authBase}/auth/refresh-token`, null, {
            params: { refreshToken },
            timeout: 15000,
          })
          .then(unpack)
          .finally(() => {
            refreshing = null;
          });
        const fresh = await refreshing;
        localStorage.setItem("accessToken", fresh.tokenContent);
        config.headers.Authorization = `Bearer ${fresh.tokenContent}`;
        return client(config);
      } catch (failure) {
        if (
          failure.response?.status === 401 ||
          failure.response?.status === 403
        ) {
          for (const key of ["accessToken", "refreshToken", "user"])
            localStorage.removeItem(key);
          window.dispatchEvent(new Event("ec-session-ended"));
        }
        return Promise.reject(failure);
      }
    },
  );
}
export const displayTime = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa cập nhật";
export const labels = {
  PENDING: "Chờ xác minh",
  VERIFIED: "Đã xác minh",
  REJECTED: "Bị từ chối",
  ACTIVE: "Đang diễn ra",
  RESOLVED: "Đã kết thúc",
  UNKNOWN: "Chưa rõ diễn biến",
};
export const isManager = (user) =>
  ["ROLE_ADMIN", "ROLE_MODERATOR"].includes(user?.role);
