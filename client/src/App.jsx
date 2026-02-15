import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import ProtectedRoute from './components/ProtectedRoute'

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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
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
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  )
}

export default App
