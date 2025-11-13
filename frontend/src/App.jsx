import FloatingShape from "./components/FloatingShape"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import SuperadminDashboardPage from "./pages/SuperadminDashboardPage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import DashBoardPage from "./pages/DashBoardPage"
import { Toaster } from "react-hot-toast"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuthStore } from "./store/authStore"
import { useEffect } from "react"
import LoadingSpinner from "./components/LoadingSpinner"

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


// ✅ REDIRECT IF ALREADY LOGGED IN
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user.isVerified) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2} />

      <Routes>
        {/* 🧍 Regular Users */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["guest", "student"]}>
              <DashBoardPage />
            </ProtectedRoute>
          }
        />

        {/* 🛠️ Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

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
        <Route path="/signup" element={<RedirectAuthenticatedUser><SignUpPage /></RedirectAuthenticatedUser>} />
        <Route path="/login" element={<RedirectAuthenticatedUser><LoginPage /></RedirectAuthenticatedUser>} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;
