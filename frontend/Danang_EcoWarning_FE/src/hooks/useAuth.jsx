import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Kiểm tra đăng nhập khi f5 trang
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    try {
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object") {
          setIsAuthenticated(true);
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem("user");
    }
    const ended = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener("ec-session-ended", ended);
    setLoading(false);
    return () => window.removeEventListener("ec-session-ended", ended);
  }, []);

  // Hàm chạy khi Login thành công (Bước 2 verify OTP xong)
  const loginSuccess = (data) => {
    // data: { tokenContent, refreshToken, userId, userName, roleName... }
    localStorage.setItem("accessToken", data.tokenContent);
    localStorage.setItem("refreshToken", data.refreshToken);

    const userInfo = {
      id: data.userId,
      email: data.userName,
      role: data.roleName,
    };
    localStorage.setItem("user", JSON.stringify(userInfo));

    setUser(userInfo);
    setIsAuthenticated(true);
  };

  // Hàm Logout (Xóa data client)
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loginSuccess, logout, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
