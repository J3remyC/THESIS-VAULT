import FloatingShape from "./components/FloatingShape"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import { Toaster } from 'react-hot-toast'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useAuthStore } from "./store/authStore"
import { useEffect } from "react"
import DashBoardPage from "./pages/DashBoardPage"
import LoadingSpinner from "./components/LoadingSpinner"


// PROTECT ROUTES THAT REQUIRE AUTHENTICATION
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if(!isAuthenticated){
    return <Navigate to ="/login" replace />
  }
  if(!user.isVerified){
    return <Navigate to ="/verify-email" replace />
  }

  return children;
}

// REDIRECT AUTHENTICADED USERS TO HOMEPAGE
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to="/" replace />
  }
  return children;
}

function App() {
  const { isCheckingAuth, checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth) return <LoadingSpinner></LoadingSpinner>


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      <FloatingShape
        color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0}
      />
      <FloatingShape
        color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5}
      />
      <FloatingShape
        color="bg-lime-500" size="w-32 h-32" top="40%" left="10%" delay={2}
      />

      <Routes>
        <Route path='/' element={<ProtectedRoute>
          <DashBoardPage></DashBoardPage>
        </ProtectedRoute>} />
        <Route path='/signup' element=
          {< RedirectAuthenticatedUser>
            <SignUpPage></SignUpPage>
          </RedirectAuthenticatedUser>} />
          <Route path='/login' element=
          {< RedirectAuthenticatedUser>
            <LoginPage></LoginPage>
          </RedirectAuthenticatedUser>} />        
          <Route path='/verify-email' element={< EmailVerificationPage />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
