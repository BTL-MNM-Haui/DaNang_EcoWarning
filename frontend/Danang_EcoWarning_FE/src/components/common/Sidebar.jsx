import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // 1. Import Auth Context
import authService from "../../services/authService"; // 2. Import Service
import "../../styles/components/_sidebar.scss";

import {
  FaChartPie,
  FaMapMarkedAlt,
  FaExclamationTriangle,
  FaUserCog,
  FaSignOutAlt, // 3. Import icon Logout
} from "react-icons/fa";
import { FaRegSun } from "react-icons/fa6";

const Sidebar = () => {
  const { logout } = useAuth(); // Lấy hàm logout từ Context (để xóa local storage)
  const navigate = useNavigate();

  // Xử lý sự kiện đăng xuất
  const handleLogout = async () => {
    const confirm = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (!confirm) return;

    try {
      // 1. Gọi API Backend để blacklist token (Theo yêu cầu AUTH-09) [cite: 57, 192]
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Lỗi đăng xuất server:", error);
      // Dù API lỗi vẫn cho client logout để tránh kẹt
    } finally {
      // 2. Xóa data client và chuyển về trang Login
      logout();
      navigate("/login");
    }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/icons/Logo.png" alt="Logo" />
      </div>

      <div className="sidebar-content">
        <ul className="sidebar-nav">
          <li className="sidebar-item">
            <NavLink to="/" className="sidebar-link" end>
              <FaChartPie className="sidebar-icon" />
              <span className="sidebar-text">Dashboard</span>
            </NavLink>
          </li>
          <li className="sidebar-item">
            <NavLink to="/weather" className="sidebar-link">
              <FaRegSun className="sidebar-icon" />
              <span className="sidebar-text">Weather</span>
            </NavLink>
          </li>
          <li className="sidebar-item">
            <NavLink to="/map" className="sidebar-link">
              <FaMapMarkedAlt className="sidebar-icon" />
              <span className="sidebar-text">Map</span>
            </NavLink>
          </li>
          <li className="sidebar-item">
            <NavLink to="/report" className="sidebar-link">
              <FaExclamationTriangle className="sidebar-icon" />
              <span className="sidebar-text">Báo cáo sự cố</span>
            </NavLink>
          </li>
          <li className="sidebar-item">
            <NavLink to="/profile" className="sidebar-link">
              <FaUserCog className="sidebar-icon" />
              <span className="sidebar-text">Tài khoản</span>
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link logout-btn">
            <FaSignOutAlt className="sidebar-icon" />
            <span className="sidebar-text">Đăng xuất</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
