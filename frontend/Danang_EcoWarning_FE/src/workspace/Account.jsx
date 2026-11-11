import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { session, unpack, message } from "./api";
import { useResource } from "./useResource";
import { Feedback } from "./shared";

export function AuthPage({ mode = "login" }) {
  const [step, setStep] = useState(0),
    [form, setForm] = useState({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      otp: "",
      newPassword: "",
    }),
    [otpToken, setOtpToken] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState("");
  const { loginSuccess } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const field = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login" && step === 0) {
        const data = await session
          .post("/auth/otp-sign-in", {
            email: form.email,
            password: form.password,
          })
          .then(unpack);
        setOtpToken(data.tokenContent);
        setStep(1);
      } else if (mode === "login") {
        const data = await session
          .post(`/auth/verify-sign-in/${form.otp}`, null, {
            headers: { Authorization: `Bearer ${otpToken}` },
          })
          .then(unpack);
        loginSuccess(data);
        navigate(location.state?.from || "/");
      } else if (mode === "register") {
        if (form.password !== form.confirmPassword)
          throw new Error("Mật khẩu xác nhận chưa khớp.");
        await session.post("/auth/register", {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
        });
        setSuccess(
          "Đã tạo tài khoản. Bạn có thể đăng nhập bằng mật khẩu và OTP email.",
        );
      } else if (step === 0) {
        await session.post("/auth/forgot-password", { email: form.email });
        setStep(1);
      } else if (step === 1) {
        await session.post(`/auth/verify-forgot-password/${form.otp}`, null, {
          params: { email: form.email },
        });
        setStep(2);
      } else {
        if (form.newPassword !== form.confirmPassword)
          throw new Error("Mật khẩu xác nhận chưa khớp.");
        await session.post("/auth/reset-password", {
          email: form.email,
          newPassword: form.newPassword,
        });
        setSuccess("Đã đổi mật khẩu. Hãy đăng nhập lại.");
      }
    } catch (err) {
      setError(err.response ? message(err) : err.message);
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    login: step ? "Xác thực đăng nhập" : "Đăng nhập",
    register: "Tham gia cộng đồng",
    forgot: step === 2 ? "Đặt mật khẩu mới" : "Khôi phục tài khoản",
  };
  const input = (key, label, type = "text", props = {}) => (
    <label key={key}>
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(event) => field(key, event.target.value)}
        required
        disabled={busy}
        {...props}
      />
    </label>
  );
  return (
    <main className="ec-auth-page">
      <Link className="ec-auth-back" to="/">
        ← Xem bản đồ công khai
      </Link>
      <section className="ec-auth-sheet">
        <img
          className="ec-auth-logo"
          src="/brand/logo.svg"
          alt="EcoWarning Đà Nẵng"
        />
        <h1>{titles[mode]}</h1>
        <p>
          {mode === "register"
            ? "Góp thêm một ghi nhận để cộng đồng có thông tin mới hơn."
            : "Theo dõi khu vực, chia sẻ ghi nhận và nhận cập nhật sự cố."}
        </p>
        {success ? (
          <div role="status">
            <p className="ec-success">{success}</p>
            <Link className="ec-button" to="/login">
              Đến trang đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {(mode === "register" || step === 0) &&
              input("email", "Email", "email", {
                autoComplete: "email",
                maxLength: 254,
              })}
            {mode === "register" && (
              <div className="ec-filter-grid">
                {input("lastName", "Họ", "text", {
                  autoComplete: "family-name",
                  maxLength: 50,
                })}
                {input("firstName", "Tên", "text", {
                  autoComplete: "given-name",
                  maxLength: 50,
                })}
              </div>
            )}
            {mode === "register" && (
              <label>
                Số điện thoại (tùy chọn)
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => field("phone", e.target.value)}
                  autoComplete="tel"
                  maxLength={15}
                />
              </label>
            )}
            {((mode === "login" && step === 0) || mode === "register") &&
              input("password", "Mật khẩu", "password", {
                autoComplete:
                  mode === "login" ? "current-password" : "new-password",
                minLength: mode === "register" ? 8 : undefined,
              })}
            {mode === "register" && (
              <>
                <p className="ec-muted">
                  Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
                </p>
                {input("confirmPassword", "Nhập lại mật khẩu", "password", {
                  autoComplete: "new-password",
                  minLength: 8,
                })}
              </>
            )}
            {step === 1 && mode !== "register" && (
              <>
                <p>
                  Mã xác minh được gửi đến <strong>{form.email}</strong>.
                </p>
                {input("otp", "Mã OTP gồm 6 chữ số", "text", {
                  inputMode: "numeric",
                  autoComplete: "one-time-code",
                  pattern: "[0-9]{6}",
                  maxLength: 6,
                })}
              </>
            )}
            {mode === "forgot" && step === 2 && (
              <>
                {input("newPassword", "Mật khẩu mới", "password", {
                  autoComplete: "new-password",
                  minLength: 8,
                })}
                <p className="ec-muted">
                  Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
                </p>
                {input("confirmPassword", "Nhập lại mật khẩu", "password", {
                  autoComplete: "new-password",
                  minLength: 8,
                })}
              </>
            )}
            {error && (
              <p role="alert" className="ec-error">
                {error}
              </p>
            )}
            <button className="ec-button" disabled={busy}>
              {busy
                ? "Đang xử lý…"
                : mode === "register"
                  ? "Tạo tài khoản"
                  : mode === "login"
                    ? step
                      ? "Xác nhận OTP"
                      : "Tiếp tục đăng nhập"
                    : step === 2
                      ? "Lưu mật khẩu mới"
                      : step === 1
                        ? "Xác minh OTP"
                        : "Gửi mã khôi phục"}
            </button>
            {step === 1 && (
              <button
                type="button"
                className="ec-auth-reset"
                onClick={() => {
                  setStep(0);
                  setError("");
                }}
                disabled={busy}
              >
                Đổi email hoặc gửi lại mã
              </button>
            )}
          </form>
        )}
        <div className="ec-auth-links">
          {mode === "login" ? (
            <>
              <Link to="/register">Tạo tài khoản</Link>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </>
          ) : (
            <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
          )}
        </div>
      </section>
      <p className="ec-auth-note">
        Xem bản đồ không cần tài khoản. Đăng nhập khi bạn muốn đóng góp.
      </p>
    </main>
  );
}

export function Profile() {
  const resource = useResource(() => session.get("/user/profile").then(unpack));
  const [password, setPassword] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(event, kind) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      if (kind === "profile") {
        const form = new FormData(event.currentTarget);
        await session.put("/user/profile", Object.fromEntries(form));
        resource.reload();
      } else {
        if (password.newPassword !== password.confirmPassword)
          throw new Error("Mật khẩu xác nhận chưa khớp.");
        await session.put("/user/change-password", password);
        setPassword({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
      setFeedback("Đã lưu thay đổi.");
    } catch (err) {
      setError(err.response ? message(err) : err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ec-page">
      <div className="ec-page-heading">
        <div>
          <h1>Tài khoản của tôi</h1>
          <p>Thông tin cá nhân và bảo mật đăng nhập.</p>
        </div>
      </div>
      {feedback && (
        <p className="ec-success" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="ec-error" role="alert">
          {error}
        </p>
      )}
      <Feedback resource={resource}>
        {resource.value && (
          <div className="ec-detail-grid">
            <section className="ec-panel">
              <h2>Thông tin cá nhân</h2>
              <form
                onSubmit={(event) => save(event, "profile")}
                key={JSON.stringify(resource.value)}
              >
                <div className="ec-filter-grid">
                  <label>
                    Họ
                    <input
                      name="lastName"
                      defaultValue={resource.value.lastName}
                      required
                      maxLength={50}
                    />
                  </label>
                  <label>
                    Tên
                    <input
                      name="firstName"
                      defaultValue={resource.value.firstName}
                      required
                      maxLength={50}
                    />
                  </label>
                </div>
                <label>
                  Email
                  <input value={resource.value.email || ""} readOnly />
                </label>
                <label>
                  Số điện thoại
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={resource.value.phone}
                    maxLength={15}
                  />
                </label>
                <button className="ec-button" disabled={busy}>
                  Lưu thông tin
                </button>
              </form>
            </section>
            <section className="ec-panel">
              <h2>Đổi mật khẩu</h2>
              <form onSubmit={(event) => save(event, "password")}>
                {[
                  ["currentPassword", "Mật khẩu hiện tại"],
                  ["newPassword", "Mật khẩu mới"],
                  ["confirmPassword", "Nhập lại mật khẩu mới"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="password"
                      value={password[key]}
                      onChange={(e) =>
                        setPassword((p) => ({ ...p, [key]: e.target.value }))
                      }
                      required
                      minLength={key === "currentPassword" ? undefined : 8}
                      autoComplete={
                        key === "currentPassword"
                          ? "current-password"
                          : "new-password"
                      }
                    />
                  </label>
                ))}
                <p className="ec-muted">
                  Mật khẩu mới gồm ít nhất 8 ký tự, có chữ hoa, chữ thường và
                  số.
                </p>
                <button className="ec-button" disabled={busy}>
                  Đổi mật khẩu
                </button>
              </form>
            </section>
          </div>
        )}
      </Feedback>
    </div>
  );
}
