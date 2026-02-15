import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import { useEffect } from 'react'

// Pages
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/AdminLogin'
import AdminRegister from './pages/AdminRegister'
import VoterLogin from './pages/VoterLogin'
import Dashboard from './pages/admin/Dashboard'
import ElectionManager from './pages/admin/ElectionManager'
import ElectionDetail from './pages/admin/ElectionDetail'
import VoterManager from './pages/admin/VoterManager'
import LiveResults from './pages/admin/LiveResults'
import VotingBooth from './pages/voter/VotingBooth'
import VoteSuccess from './pages/voter/VoteSuccess'
import VoterSignup from './pages/VoterSignup'

// Wrapper to handle redirects based on auth status
const AppRoutes = () => {
  const { user, loading, isAdmin, isVoter } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Redirect if logged in and trying to access public auth pages
  if (user && ['/admin/login', '/vote', '/vote/signup'].includes(location.pathname)) {
    if (isAdmin()) return <Navigate to="/admin/dashboard" replace />;
    if (isVoter()) return <Navigate to="/vote/booth" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/vote/signup" element={<VoterSignup />} />
      <Route path="/vote" element={<VoterLogin />} />
      <Route path="/vote/success" element={<VoteSuccess />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/admin/elections/new" element={
        <ProtectedRoute role="admin"><ElectionManager /></ProtectedRoute>
      } />
      <Route path="/admin/elections/:id" element={
        <ProtectedRoute role="admin"><ElectionDetail /></ProtectedRoute>
      } />
      <Route path="/admin/elections/:id/voters" element={
        <ProtectedRoute role="admin"><VoterManager /></ProtectedRoute>
      } />
      <Route path="/admin/elections/:id/results" element={
        <ProtectedRoute role="admin"><LiveResults /></ProtectedRoute>
      } />

      {/* Voter Routes */}
      <Route path="/vote/booth" element={
        <ProtectedRoute role="voter"><VotingBooth /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1e293b', color: '#fff', borderRadius: '10px' }
            }}
          />
          <AppRoutes />
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App
