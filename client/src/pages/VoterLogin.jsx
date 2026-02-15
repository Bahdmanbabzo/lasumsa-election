import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { voterLogin } from '../services/api';
import { Vote, Hash, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoterLogin() {
  const [matricNumber, setMatricNumber] = useState('');
  const [votingCode, setVotingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await voterLogin({
        matric_number: matricNumber.toUpperCase().trim(),
        voting_code: votingCode.trim()
      });
      login(data.token, data.voter);
      toast.success(`Welcome, ${data.voter.name}!`);
      navigate('/vote/booth');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
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
          <p className="text-green-300 mt-2">Enter your credentials to cast your vote</p>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              Your vote is secure and anonymous. You can only vote once using your unique credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Matric Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                  className="input-field !pl-11 uppercase"
                  placeholder="MAT/2024/001"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Voting Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={votingCode}
                  onChange={(e) => setVotingCode(e.target.value.toUpperCase())}
                  className="input-field !pl-11 uppercase tracking-wider"
                  placeholder="VOTE-XXX-XXX"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Proceed to Vote <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/admin/login" className="text-green-300 hover:text-white text-sm font-medium transition">
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
