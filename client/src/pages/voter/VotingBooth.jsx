import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getElectionBallot, castVote } from '../../services/api';
import { Vote, User, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, LogOut, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VotingBooth() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ballot, setBallot] = useState(null);
  const [selections, setSelections] = useState({});
  const [currentPosition, setCurrentPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadBallot();
  }, []);

  const loadBallot = async () => {
    try {
      const { data } = await getElectionBallot(user.election_id);
      setBallot(data);
    } catch (err) {
      toast.error('Failed to load ballot');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (positionId, candidateId) => {
    setSelections(prev => ({ ...prev, [positionId]: candidateId }));
  };

  const handleNext = () => {
    const pos = ballot.positions[currentPosition];
    if (!selections[pos.id]) {
      return toast.error('Please select a candidate before proceeding');
    }
    if (currentPosition < ballot.positions.length - 1) {
      setCurrentPosition(prev => prev + 1);
    } else {
      setShowConfirm(true);
    }
  };

  const handlePrev = () => {
    if (currentPosition > 0) {
      setCurrentPosition(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const votes = Object.entries(selections).map(([position_id, candidate_id]) => ({
        position_id,
        candidate_id
      }));

      await castVote({ votes });
      toast.success('Your vote has been cast successfully!');
      logout();
      navigate('/vote/success');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cast vote');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/vote');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ballot...</p>
        </div>
      </div>
    );
  }

  if (!ballot || !ballot.positions?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Ballot Available</h2>
          <p className="text-gray-500 mb-6">The ballot for this election is not yet ready.</p>
          <button onClick={handleLogout} className="btn-secondary">Go Back</button>
        </div>
      </div>
    );
  }

  const position = ballot.positions[currentPosition];
  const progress = ((currentPosition + 1) / ballot.positions.length) * 100;
  const allSelected = ballot.positions.every(p => selections[p.id]);

  // Confirmation screen
  if (showConfirm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Confirm Your Votes</h2>
              <p className="text-gray-500 mt-2">Please review your selections below. This action cannot be undone.</p>
            </div>

            <div className="space-y-3 mb-8">
              {ballot.positions.map((pos) => {
                const selected = pos.candidates.find(c => c.id === selections[pos.id]);
                return (
                  <div key={pos.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{pos.title}</p>
                      <p className="text-sm font-semibold text-gray-900">{selected?.name}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Vote className="w-5 h-5" /> Submit My Vote
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{ballot.title}</p>
              <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>
      </nav>

      {/* Progress */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Position {currentPosition + 1} of {ballot.positions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Ballot */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{position.title}</h2>
          {position.description && <p className="text-gray-500 mt-1">{position.description}</p>}
          <p className="text-sm text-green-600 font-medium mt-2">Select one candidate</p>
        </div>

        <div className="space-y-3">
          {position.candidates.map((candidate) => {
            const isSelected = selections[position.id] === candidate.id;
            return (
              <button
                key={candidate.id}
                onClick={() => handleSelect(position.id, candidate.id)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                      {candidate.name}
                    </h3>
                    {candidate.bio && (
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{candidate.bio}</p>
                    )}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentPosition === 0}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-medium transition-all ${
              currentPosition === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <div className="flex gap-1.5">
            {ballot.positions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentPosition
                    ? 'bg-green-500 w-6'
                    : selections[ballot.positions[i].id]
                    ? 'bg-green-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!selections[position.id]}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-semibold transition-all ${
              !selections[position.id]
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : currentPosition === ballot.positions.length - 1
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {currentPosition === ballot.positions.length - 1 ? 'Review & Submit' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
