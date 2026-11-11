import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import {
  FaUser,
  FaLock,
  FaKey,
  FaEnvelope,
  FaCheckCircle,
} from "react-icons/fa";
import "../../styles/pages/Auth.scss";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // State quản lý luồng: 1 (Email), 2 (OTP), 3 (New Password), 4 (Success)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Dữ liệu form
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // BƯỚC 1: Gửi yêu cầu lấy OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setStep(2); // Chuyển sang nhập OTP
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không tìm thấy email này trong hệ thống."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 2: Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await authService.verifyForgotPasswordOtp(email, otp);
      setStep(3); // Chuyển sang đặt mật khẩu mới
    } catch (err) {
      setError("Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 3: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, password);
      setStep(4); // Hoàn tất
    } catch (err) {
      setError("Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/brand/logo.svg" alt="Logo" className="auth-logo" />
          <h2>Khôi phục mật khẩu</h2>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* --- STEP 1: NHẬP EMAIL --- */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <p style={{ marginBottom: "15px", color: "#666" }}>
              Nhập email đã đăng ký để nhận mã xác thực.
            </p>
            <div className="form-group">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="email"
                placeholder="Nhập địa chỉ Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {/* --- STEP 2: NHẬP OTP --- */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-message">
              <FaEnvelope className="otp-icon" />
              <p>
                Mã OTP đã được gửi tới <strong>{email}</strong>
              </p>
            </div>
            <div className="form-group">
              <div className="input-icon">
                <FaKey />
              </div>
              <input
                type="text"
                placeholder="Nhập mã OTP 6 số"
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
              Gửi lại hoặc đổi Email
            </button>
          </form>
        )}

        {/* --- STEP 3: ĐẶT MẬT KHẨU MỚI --- */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p style={{ marginBottom: "15px", color: "#666" }}>
              Vui lòng nhập mật khẩu mới của bạn.
            </p>
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}

        {/* --- STEP 4: THÀNH CÔNG --- */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <FaCheckCircle
              size={50}
              color="#27ae60"
              style={{ marginBottom: "15px" }}
            />
            <h3 style={{ color: "#27ae60", marginBottom: "10px" }}>
              Thành công!
            </h3>
            <p style={{ marginBottom: "20px" }}>
              Mật khẩu của bạn đã được cập nhật.
            </p>
            <button className="auth-btn" onClick={() => navigate("/login")}>
              Về trang đăng nhập
            </button>
          </div>
        )}

        {step !== 4 && (
          <div className="auth-footer">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
