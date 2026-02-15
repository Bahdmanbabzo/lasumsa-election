import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getElection, updateElection, deleteElection, addPosition, deletePosition, addCandidate, deleteCandidate } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Trash2, Users, BarChart3, Play, Square, CheckCircle, AlertTriangle, User, Briefcase, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ElectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [positionDesc, setPositionDesc] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateBio, setCandidateBio] = useState('');

  useEffect(() => {
    loadElection();
  }, [id]);

  const loadElection = async () => {
    try {
      const { data } = await getElection(id);
      setElection(data);
    } catch (err) {
      toast.error('Failed to load election');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmMsg = newStatus === 'active'
      ? 'Launch this election? Voters will be able to cast votes.'
      : newStatus === 'completed'
      ? 'End this election? No more votes will be accepted.'
      : `Change status to ${newStatus}?`;

    if (!confirm(confirmMsg)) return;

    try {
      await updateElection(id, { status: newStatus });
      toast.success(`Election ${newStatus === 'active' ? 'launched' : newStatus}!`);
      loadElection();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAddPosition = async (e) => {
    e.preventDefault();
    try {
      await addPosition({ election_id: id, title: positionTitle, description: positionDesc });
      toast.success('Position added!');
      setShowPositionModal(false);
      setPositionTitle('');
      setPositionDesc('');
      loadElection();
    } catch (err) {
      toast.error('Failed to add position');
    }
  };

  const handleDeletePosition = async (posId) => {
    if (!confirm('Delete this position and all its candidates?')) return;
    try {
      await deletePosition(posId);
      toast.success('Position deleted');
      loadElection();
    } catch (err) {
      toast.error('Failed to delete position');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      await addCandidate({
        position_id: showCandidateModal,
        election_id: id,
        name: candidateName,
        bio: candidateBio
      });
      toast.success('Candidate added!');
      setShowCandidateModal(null);
      setCandidateName('');
      setCandidateBio('');
      loadElection();
    } catch (err) {
      toast.error('Failed to add candidate');
    }
  };

  const handleDeleteCandidate = async (candId) => {
    if (!confirm('Delete this candidate?')) return;
    try {
      await deleteCandidate(candId);
      toast.success('Candidate deleted');
      loadElection();
    } catch (err) {
      toast.error('Failed to delete candidate');
    }
  };

  const handleDeleteElection = async () => {
    if (!confirm('Are you sure you want to delete this election? This cannot be undone.')) return;
    try {
      await deleteElection(id);
      toast.success('Election deleted');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete election');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!election) return null;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
          <p className="text-gray-500 mt-1">{election.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {election.status === 'draft' && (
            <button onClick={() => handleStatusChange('active')} className="btn-success !py-2 !px-4 text-sm flex items-center gap-1">
              <Play className="w-4 h-4" /> Launch Election
            </button>
          )}
          {election.status === 'active' && (
            <button onClick={() => handleStatusChange('completed')} className="btn-danger !py-2 !px-4 text-sm flex items-center gap-1">
              <Square className="w-4 h-4" /> End Election
            </button>
          )}
          <Link to={`/admin/elections/${id}/voters`} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1">
            <Users className="w-4 h-4" /> Manage Voters
          </Link>
          {(election.status === 'active' || election.status === 'completed') && (
            <Link to={`/admin/elections/${id}/results`} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> Live Results
            </Link>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{election.status}</p>
          <p className="text-sm text-gray-500">Status</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{election.positions?.length || 0}</p>
          <p className="text-sm text-gray-500">Positions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{election.voter_stats?.total_voters || 0}</p>
          <p className="text-sm text-gray-500">Voters</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{election.voter_stats?.votes_cast || 0}</p>
          <p className="text-sm text-gray-500">Votes Cast</p>
        </div>
      </div>

      {/* Positions & Candidates */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Ballot Positions</h2>
        {election.status === 'draft' && (
          <button onClick={() => setShowPositionModal(true)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Position
          </button>
        )}
      </div>

      {election.positions?.length === 0 ? (
        <div className="card p-8 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No positions yet. Add positions and candidates to build your ballot.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {election.positions?.map((position, index) => (
            <div key={position.id} className="card">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {index + 1}. {position.title}
                  </h3>
                  {position.description && (
                    <p className="text-sm text-gray-500 mt-1">{position.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {election.status === 'draft' && (
                    <>
                      <button onClick={() => setShowCandidateModal(position.id)} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Candidate
                      </button>
                      <button onClick={() => handleDeletePosition(position.id)} className="text-red-500 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5">
                {position.candidates?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No candidates yet</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {position.candidates?.map((candidate) => (
                      <div key={candidate.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg group">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{candidate.name}</p>
                          {candidate.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{candidate.bio}</p>}
                        </div>
                        {election.status === 'draft' && (
                          <button onClick={() => handleDeleteCandidate(candidate.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      {election.status !== 'active' && (
        <div className="mt-10 card border-red-200 p-6">
          <h3 className="text-red-700 font-semibold flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-gray-500 mb-4">Deleting an election is permanent and cannot be undone.</p>
          <button onClick={handleDeleteElection} className="btn-danger !py-2 !px-4 text-sm flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete Election
          </button>
        </div>
      )}

      {/* Add Position Modal */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Position</h3>
              <button onClick={() => setShowPositionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPosition} className="space-y-4">
              <div>
                <label className="label">Position Title</label>
                <input type="text" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} className="input-field" placeholder="e.g., President" required />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea value={positionDesc} onChange={(e) => setPositionDesc(e.target.value)} className="input-field !h-20 resize-none" placeholder="Role description..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Add Position</button>
                <button type="button" onClick={() => setShowPositionModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Candidate</h3>
              <button onClick={() => setShowCandidateModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="label">Candidate Name</label>
                <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} className="input-field" placeholder="Full name" required />
              </div>
              <div>
                <label className="label">Bio (optional)</label>
                <textarea value={candidateBio} onChange={(e) => setCandidateBio(e.target.value)} className="input-field !h-20 resize-none" placeholder="Brief bio..." />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Add Candidate</button>
                <button type="button" onClick={() => setShowCandidateModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
