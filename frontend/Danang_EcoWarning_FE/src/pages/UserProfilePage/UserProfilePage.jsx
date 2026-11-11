import React, { useState, useEffect } from "react";
import userService from "../../services/userService";
import { FaUser, FaLock, FaSave } from "react-icons/fa";
import "../../styles/pages/UserProfile.scss"; // File style tạo ở bước 4

const UserProfilePage = () => {
  const [loading, setLoading] = useState(false);

  // State cho thông tin cá nhân
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "", // Email thường là readonly
    phone: "",
    role: "",
  });

  // State cho đổi mật khẩu
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load dữ liệu khi vào trang
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userService.getProfile();
      if (res.data && res.data.data) {
        setProfile(res.data.data); // Map dữ liệu từ API vào state
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin:", error);
    }
  };

  // Xử lý cập nhật thông tin
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      };
      await userService.updateProfile(payload);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      alert(
        "Cập nhật thất bại: " +
          (error.response?.data?.message || "Lỗi hệ thống")
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(passData);
      alert("Đổi mật khẩu thành công!");
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Reset form
    } catch (error) {
      alert(
        "Đổi mật khẩu thất bại: " +
          (error.response?.data?.message || "Mật khẩu cũ không đúng")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h2 className="page-title">Quản lý tài khoản</h2>

      <div className="profile-container">
        {/* --- CỘT TRÁI: THÔNG TIN CÁ NHÂN --- */}
        <div className="profile-card">
          <div className="card-header">
            <FaUser className="icon" />
            <h3>Thông tin cá nhân</h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-row">
              <div className="form-group half">
                <label>Họ</label>
                <input
                  type="text"
                  value={profile.lastName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
              <div className="form-group half">
                <label>Tên</label>
                <input
                  type="text"
                  value={profile.firstName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email (Không thể thay đổi)</label>
              <input
                type="email"
                value={profile.email || ""}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Vai trò</label>
              <input
                type="text"
                value={profile.role || "User"}
                disabled
                className="disabled-input"
              />
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              <FaSave /> Lưu thay đổi
            </button>
          </form>
        </div>

        {/* --- CỘT PHẢI: ĐỔI MẬT KHẨU --- */}
        <div className="profile-card">
          <div className="card-header">
            <FaLock className="icon" />
            <h3>Đổi mật khẩu</h3>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu cũ"
                value={passData.oldPassword}
                onChange={(e) =>
                  setPassData({ ...passData, oldPassword: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={passData.newPassword}
                onChange={(e) =>
                  setPassData({ ...passData, newPassword: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={passData.confirmPassword}
                onChange={(e) =>
                  setPassData({ ...passData, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="save-btn warning"
              disabled={loading}
            >
              <FaSave /> Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
