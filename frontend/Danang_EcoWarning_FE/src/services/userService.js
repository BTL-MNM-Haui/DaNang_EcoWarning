import axiosClient from "./axiosClient";

const userService = {
  // 1. Lấy thông tin cá nhân (GET /api/v1/user/profile)
  getProfile: () => {
    return axiosClient.get("/user/profile");
  },

  // 2. Cập nhật thông tin (PUT /api/v1/user/profile)
  updateProfile: (data) => {
    // data gồm: firstName, lastName, phone
    return axiosClient.put("/user/profile", data);
  },

  // 3. Đổi mật khẩu (PUT /api/v1/user/change-password)
  changePassword: (data) => {
    // data gồm: oldPassword, newPassword, confirmPassword
    return axiosClient.put("/user/change-password", data);
  },
};

export default userService;
