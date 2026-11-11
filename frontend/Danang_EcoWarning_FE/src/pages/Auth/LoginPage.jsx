import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import authService from "../../services/authService";
import { FaUser, FaLock, FaKey, FaEnvelope } from "react-icons/fa"; // Cài: npm install react-icons
import "../../styles/pages/Auth.scss"; // File style chung tôi viết ở dưới

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useAuth();

  // State quản lý luồng
  const [step, setStep] = useState(1); // 1: Nhập User/Pass, 2: Nhập OTP
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State dữ liệu
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState(""); // Token tạm dùng để verify OTP

  // Xử lý Bước 1: Gửi Email & Password
  const handleLoginStep1 = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Gọi API: /api/v1/auth/otp-sign-in [cite: 107]
      const res = await authService.loginStep1(email, password);

      // Lấy OTP Token từ response để dùng cho bước 2 [cite: 118]
      const { tokenContent } = res.data.data;
      setOtpToken(tokenContent);

      // Chuyển sang màn hình nhập OTP
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Email hoặc mật khẩu không chính xác."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Bước 2: Gửi OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Gọi API: /api/v1/auth/verify-sign-in/{otp} [cite: 122]
      // Truyền otpToken vào header (đã xử lý trong authService)
      const res = await authService.verifyOtpLogin(otp, otpToken);

      // Lưu token và redirect vào Dashboard
      loginSuccess(res.data.data); // [cite: 132-140]
      navigate(location.state?.from || "/");
    } catch (err) {
      setError("Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/brand/logo.svg" alt="Logo" className="auth-logo" />
          <h2>{step === 1 ? "Đăng nhập" : "Xác thực OTP"}</h2>
          <p>Hệ thống cảnh báo môi trường Đà Nẵng</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          /* FORM BƯỚC 1: EMAIL & PASSWORD */
          <form onSubmit={handleLoginStep1}>
            <div className="form-group">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="email"
                placeholder="Email đăng nhập"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        ) : (
          /* FORM BƯỚC 2: OTP */
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-message">
              <FaEnvelope className="otp-icon" />
              <p>
                Mã OTP 6 số đã được gửi tới <strong>{email}</strong>
              </p>
            </div>

            <div className="form-group">
              <div className="input-icon">
                <FaKey />
              </div>
              <input
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Đang xác thực..." : "Xác nhận"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(1)}
            >
              Quay lại đăng nhập
            </button>
          </form>
        )}

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
