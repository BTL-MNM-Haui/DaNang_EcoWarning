import { authClient } from "./axiosClient"; // Import authClient

const authService = {
  loginStep1: (email, password) => {
    return authClient.post("/auth/otp-sign-in", { email, password });
  },

  verifyOtpLogin: (otp, otpToken) => {
    return authClient.post(`/auth/verify-sign-in/${otp}`, null, {
      headers: { Authorization: `Bearer ${otpToken}` },
    });
  },

  register: (data) => {
    return authClient.post("/auth/register", data);
  },

  logout: (refreshToken) => {
    return authClient.post("/auth/logout", null, { params: { refreshToken } });
  },
};

export default authService;
