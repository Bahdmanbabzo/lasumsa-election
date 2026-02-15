import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Vote, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoterLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext will update user state automatically
      // We can also double check profile here if needed, but context handles it.
      toast.success(`Welcome back!`);
      navigate('/vote/booth'); // Or dashboard if you have one
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">LASUMSA Elections</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Voter Login</h1>
          <p className="text-green-300 mt-2">Enter your credentials to access your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/10">
          <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <ShieldCheck className="w-6 h-6 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-100">
              Your vote is secure and anonymous.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-green-100 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-green-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="student@lasu.edu.ng"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-100 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-green-200/50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-green-900/50 flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Login <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <Link to="/vote/signup" className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border border-green-500/50 text-green-300 hover:bg-green-500/10 transition-colors text-sm font-medium">
              <UserPlus className="w-4 h-4" /> Don't have an account? Register
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/admin/login" className="text-green-400 hover:text-green-300 text-sm font-medium transition underline-offset-4 hover:underline">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
