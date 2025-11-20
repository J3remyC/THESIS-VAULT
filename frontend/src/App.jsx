import FloatingShape from "./components/FloatingShape"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import SuperadminDashboardPage from "./pages/SuperadminDashboardPage"
import AdminLayout from "./pages/admin/AdminLayout";
import ActivityLogs from "./pages/admin/ActivityLogs";
import AllTheses from "./pages/AllTheses";
import UploadThesis from "./pages/UploadThesis";
import AdminOverview from "./pages/admin/AdminOverview";
import Overview from "./pages/Overview";
import UsersList from "./pages/admin/UsersList"
import UserAdd from "./pages/admin/UserAdd"
import ManageRoles from "./pages/admin/ManageRoles"
import ThesesAll from "./pages/admin/ThesesAll"
import ThesesPending from "./pages/admin/ThesesPending"
import ThesesTrash from "./pages/admin/ThesesTrash"
import Applications from "./pages/admin/Applications"
import Departments from "./pages/admin/Departments"
import DepartmentTheses from "./pages/admin/DepartmentTheses"
import DashBoardPage from "./pages/DashBoardPage"
import ThesisDetail from "./pages/ThesisDetail"
import { Toaster } from "react-hot-toast"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuthStore } from "./store/authStore"
import { useEffect } from "react"
import LoadingSpinner from "./components/LoadingSpinner"
import AccountSettings from "./pages/AccountSettings"
import BannedOverlay from "./components/BannedOverlay"

// ✅ PROTECTED ROUTE COMPONENT
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-email" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Softer guard: does NOT require email verification; only checks auth and role
const SoftProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};


// ✅ REDIRECT IF ALREADY LOGGED IN
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user.isVerified) return <Navigate to="/" replace />;
  return children;
};

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    {children}
  </div>
);

function App() {
  const { isCheckingAuth, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <>
      <Toaster position="top-right" />
      {user && user.isBanned && <BannedOverlay />}
      <Routes>
        {/* 🧍 Regular Users */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["guest", "student", "admin", "superadmin"]}>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["guest", "student"]}>
              <DashBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute allowedRoles={["guest", "student", "admin", "superadmin"]}>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/theses"
          element={
            <ProtectedRoute allowedRoles={["guest", "student", "admin", "superadmin"]}>
              <AllTheses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thesis/:id"
          element={
            <ProtectedRoute allowedRoles={["guest", "student", "admin", "superadmin"]}>
              <ThesisDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <SoftProtectedRoute allowedRoles={["guest", "student"]}>
              <UploadThesis />
            </SoftProtectedRoute>
          }
        />

        {/* 🛠️ Admin Dashboard (nested) */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/new" element={<UserAdd />} />
          <Route
            path="manage-roles"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <ManageRoles />
              </ProtectedRoute>
            }
          />
          <Route path="theses" element={<ThesesAll />} />
          <Route path="theses/pending" element={<ThesesPending />} />
          <Route path="theses/trash" element={<ThesesTrash />} />
          <Route path="applications" element={<Applications />} />
          <Route path="departments" element={<Departments />} />
          <Route path="departments/theses" element={<DepartmentTheses />} />
          <Route path="logs" element={<ActivityLogs />} />
        </Route>

        {/* 👑 Superadmin Dashboard */}
        <Route
          path="/superadmin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperadminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 🔑 Auth Routes */}
        <Route path="/signup" element={<AuthLayout><RedirectAuthenticatedUser><SignUpPage /></RedirectAuthenticatedUser></AuthLayout>} />
        <Route path="/login" element={<AuthLayout><RedirectAuthenticatedUser><LoginPage /></RedirectAuthenticatedUser></AuthLayout>} />
        <Route path="/verify-email" element={<AuthLayout><EmailVerificationPage /></AuthLayout>} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
