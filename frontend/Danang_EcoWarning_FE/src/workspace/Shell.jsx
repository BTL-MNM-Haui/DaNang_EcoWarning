import { useState, createElement } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  FiMap,
  FiCloud,
  FiBarChart2,
  FiFileText,
  FiBell,
  FiMapPin,
  FiCheckSquare,
  FiDatabase,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiPlus,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { isManager, session } from "./api";

export default function Shell() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const primary = [
    ["/", "Bản đồ sự cố", FiMap],
    ["/weather", "Thời tiết", FiCloud],
    ["/data", "Dữ liệu & thống kê", FiBarChart2],
  ];
  const personal = [
    ["/my-reports", "Báo cáo của tôi", FiFileText],
    ["/watch-areas", "Khu vực theo dõi", FiMapPin],
    ["/notifications", "Thông báo", FiBell],
  ];
  const management = [
    ["/manage", "Xác minh sự cố", FiCheckSquare],
    ["/imports", "Nhập dữ liệu", FiDatabase],
  ];
  const links = (items) =>
    items.map(([path, title, Icon]) => (
      <NavLink
        key={path}
        to={path}
        end
        title={title}
        aria-label={title}
        onClick={() => setOpen(false)}
      >
        {createElement(Icon, { "aria-hidden": true })}
        <span>{title}</span>
      </NavLink>
    ));
  async function signout() {
    try {
      await session.post("/auth/logout", null, {
        params: { refreshToken: localStorage.getItem("refreshToken") },
      });
    } finally {
      logout();
      setOpen(false);
    }
  }
  return (
    <div className="ec-app">
      <a className="ec-skip" href="#workspace">
        Đến nội dung
      </a>
      <header className="ec-mobile">
        <Link to="/">
          <img src="/brand/logo.svg" alt="EcoWarning Đà Nẵng" />
        </Link>
        <button
          aria-controls="main-navigation"
          aria-label={open ? "Đóng điều hướng" : "Mở điều hướng"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </header>
      <aside
        id="main-navigation"
        className={`ec-sidebar ${open ? "is-open" : ""}`}
        aria-label="Điều hướng chính"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            if (window.matchMedia("(max-width: 850px)").matches)
              document.querySelector(".ec-mobile button")?.focus();
            else document.getElementById("workspace")?.focus();
          }
        }}
      >
        <Link
          to="/"
          className="ec-brand"
          aria-label="EcoWarning Đà Nẵng — Trang chủ"
          onClick={() => setOpen(false)}
        >
          <img className="ec-brand-mark" src="/brand/mark.svg" alt="" />
          <span className="ec-brand-wordmark">
            <strong>EcoWarning</strong>
            <small>Đà Nẵng · Cùng cập nhật</small>
          </span>
        </Link>
        <div className="ec-scope">
          <span className="ec-scope-dot" />
          Đà Nẵng<span>VN</span>
        </div>
        <nav>
          {links(primary)}
          <div className="ec-nav-group">Đóng góp cộng đồng</div>
          {links(personal)}
          {isManager(user) && (
            <>
              <div className="ec-nav-group">Quản lý</div>
              {links(management)}
            </>
          )}
        </nav>
        <Link
          className="ec-button ec-report-action"
          to="/report"
          title="Báo cáo sự cố"
          aria-label="Báo cáo sự cố"
          onClick={() => setOpen(false)}
        >
          <FiPlus />
          <span>Báo cáo sự cố</span>
        </Link>
        <footer>
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="ec-account"
                title="Tài khoản của tôi"
                aria-label="Tài khoản của tôi"
              >
                <FiUser />
                <span>
                  {user?.email || "Tài khoản của tôi"}
                  <small>
                    {isManager(user) ? "Quản lý" : "Thành viên cộng đồng"}
                  </small>
                </span>
              </Link>
              <button
                className="ec-quiet"
                onClick={signout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <FiLogOut />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <p>
                Xem thông tin công khai.
                <br />
                Đăng nhập để đóng góp.
              </p>
              <Link
                className="ec-button ec-secondary"
                to="/login"
                title="Đăng nhập"
                aria-label="Đăng nhập"
              >
                <FiUser aria-hidden="true" />
                <span>Đăng nhập</span>
              </Link>
            </>
          )}
          <small>Dữ liệu có thời điểm cập nhật riêng.</small>
        </footer>
      </aside>
      <main
        id="workspace"
        tabIndex={-1}
        className={`ec-workspace ${location.pathname === "/" ? "ec-workspace--map" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
