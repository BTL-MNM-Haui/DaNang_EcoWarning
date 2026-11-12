import { AuthPage, Profile } from "./workspace/Account";
import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Shell from "./workspace/Shell";
const IncidentMap = lazy(() => import("./workspace/IncidentMap"));
const ReportForm = lazy(() => import("./workspace/ReportForm"));
const DataExplorer = lazy(() => import("./workspace/DataExplorer"));
const Weather = lazy(() => import("./workspace/Weather"));
const DataImports = lazy(() => import("./workspace/DataImports"));

const IncidentDetail = lazy(() =>
  import("./workspace/Incidents").then((module) => ({
    default: module.IncidentDetail,
  })),
);
const IncidentList = lazy(() =>
  import("./workspace/Incidents").then((module) => ({
    default: module.IncidentList,
  })),
);
const WatchAreas = lazy(() =>
  import("./workspace/Following").then((module) => ({
    default: module.WatchAreas,
  })),
);
const Notifications = lazy(() =>
  import("./workspace/Following").then((module) => ({
    default: module.Notifications,
  })),
);
function Protected({ children, manager = false }) {
  const { isAuthenticated, user, loading } = useAuth(),
    location = useLocation();
  if (loading) return <p className="ec-loading" role="status">Đang khôi phục phiên đăng nhập…</p>;
  if (!isAuthenticated)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (manager && !["ROLE_ADMIN", "ROLE_MODERATOR"].includes(user?.role))
    return (
      <div className="ec-page">
        <h1>Cần quyền quản lý</h1>
        <p>Tài khoản hiện tại chưa được cấp quyền thực hiện công việc này.</p>
      </div>
    );
  return children;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <p className="ec-loading" role="status">
              Đang mở trang…
            </p>
          }
        >
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/forgot-password"
              element={<AuthPage mode="forgot" />}
            />
            <Route element={<Shell />}>
              <Route index element={<IncidentMap />} />
              <Route path="map" element={<Navigate to="/" replace />} />
              <Route path="data" element={<DataExplorer />} />
              <Route
                path="dashboard"
                element={<Navigate to="/data" replace />}
              />
              <Route path="weather" element={<Weather />} />
              <Route
                path="report"
                element={
                  <Protected>
                    <ReportForm />
                  </Protected>
                }
              />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route
                path="my-reports"
                element={
                  <Protected>
                    <IncidentList />
                  </Protected>
                }
              />
              <Route
                path="watch-areas"
                element={
                  <Protected>
                    <WatchAreas />
                  </Protected>
                }
              />
              <Route
                path="notifications"
                element={
                  <Protected>
                    <Notifications />
                  </Protected>
                }
              />
              <Route
                path="manage"
                element={
                  <Protected manager>
                    <IncidentList manage />
                  </Protected>
                }
              />
              <Route
                path="imports"
                element={
                  <Protected manager>
                    <DataImports />
                  </Protected>
                }
              />
              <Route
                path="profile"
                element={
                  <Protected>
                    <div className="ec-page ec-profile">
                      <Profile />
                    </div>
                  </Protected>
                }
              />
              <Route
                path="*"
                element={
                  <div className="ec-page">
                    <h1>Không tìm thấy trang</h1>
                    <a href="/">Về bản đồ</a>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
