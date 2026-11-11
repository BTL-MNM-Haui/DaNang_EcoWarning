import axiosClient from "./axiosClient";

const authService = {
  // AUTH-01: Đăng ký [cite: 92]
  register: (data) => {
    return axiosClient.post("/auth/register", data);
  },

  // AUTH-02: Đăng nhập bước 1 (Lấy OTP) [cite: 107]
  loginStep1: (email, password) => {
    return axiosClient.post("/auth/otp-sign-in", { email, password });
  },

  // AUTH-03: Xác thực OTP để lấy Token [cite: 122]
  verifyOtpLogin: (otp, otpToken) => {
    // API yêu cầu OTP Token trong header Authorization
    return axiosClient.post(`/auth/verify-sign-in/${otp}`, null, {
      headers: { Authorization: `Bearer ${otpToken}` },
    });
  },

  // AUTH-09: Đăng xuất [cite: 192]
  logout: (refreshToken) => {
    return axiosClient.post("/auth/logout", null, {
      params: { refreshToken },
    });
  },

  // AUTH-04: Gửi yêu cầu quên mật khẩu
  forgotPassword: (email) => {
    return axiosClient.post("/auth/forgot-password", { email });
  },

  // AUTH-05: Xác thực OTP quên mật khẩu
  // API yêu cầu: Path param {otp} và Query param ?email=... [cite: 153-155]
  verifyForgotPasswordOtp: (email, otp) => {
    return axiosClient.post(`/auth/verify-forgot-password/${otp}`, null, {
      params: { email },
    });
  },

  // AUTH-06: Đặt lại mật khẩu mới
  resetPassword: (email, newPassword) => {
    return axiosClient.post("/auth/reset-password", {
      email,
      newPassword,
    });
  },
};

export default authService;
