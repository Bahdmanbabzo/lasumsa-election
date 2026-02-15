import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Trash2, RefreshCw, Search, Upload, ArrowLeft, CheckCircle, XCircle, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoterManager() {
  const { id: electionId } = useParams();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({ matric_number: '', name: '', email: '', department: '' });
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    loadVoters();
  }, [electionId]);

  const loadVoters = async () => {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('election_id', electionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoters(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load voters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoter = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('voters')
        .insert([{
          election_id: electionId,
          matric_number: formData.matric_number.toUpperCase().trim(),
          name: formData.name,
          email: formData.email || null,
          department: formData.department || null
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('A voter with this matric number already exists in this election.');
        }
        throw error;
      }

      toast.success('Voter added!');
      setShowAddModal(false);
      setFormData({ matric_number: '', name: '', email: '', department: '' });
      loadVoters();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to add voter');
    }
  };

  const handleBulkAdd = async () => {
    try {
      const lines = bulkText.trim().split('\n').filter(l => l.trim());
      const voterList = lines.map(line => {
        const parts = line.split(',').map(s => s.trim());
        return {
          election_id: electionId,
          matric_number: (parts[0] || '').toUpperCase().trim(),
          name: parts[1] || '',
          email: parts[2] || null,
          department: parts[3] || null
        };
      }).filter(v => v.matric_number && v.name);

      if (voterList.length === 0) {
        return toast.error('No valid voter data found');
      }

      const { data, error } = await supabase
        .from('voters')
        .upsert(voterList, { onConflict: 'election_id,matric_number', ignoreDuplicates: true })
        .select();

      if (error) throw error;

      toast.success(`${data?.length || 0} voters added!`);
      setShowBulkModal(false);
      setBulkText('');
      loadVoters();
    } catch (err) {
      console.error(err);
      toast.error('Failed to bulk add voters');
    }
  };

  const handleDelete = async (voterId) => {
    if (!confirm('Delete this voter?')) return;
    try {
      const { error } = await supabase.from('voters').delete().eq('id', voterId);
      if (error) throw error;
      toast.success('Voter deleted');
      loadVoters();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete voter');
    }
  };

  const handleRegenCode = async (voterId) => {
    try {
      // Generate a new random 6-char code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from('voters')
        .update({ voting_code: newCode })
        .eq('id', voterId);

      if (error) throw error;
      toast.success('New voting code generated');
      loadVoters();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to regenerate code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Voting code copied!');
  };

  const filteredVoters = voters.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.matric_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const votedCount = voters.filter(v => v.has_voted).length;

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/admin/elections/${electionId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Manage Voters</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{voters.length}</p>
          <p className="text-sm text-gray-500">Total Voters</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{votedCount}</p>
          <p className="text-sm text-gray-500">Voted</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{voters.length - votedCount}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field !pl-10 !py-2 text-sm"
            placeholder="Search voters..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkModal(true)} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1">
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Voter
          </button>
        </div>
      </div>

      {/* Voters Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Matric No.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Voting Code</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dept</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVoters.map((voter) => (
                  <tr key={voter.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{voter.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{voter.matric_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{voter.voting_code}</code>
                        <button onClick={() => copyCode(voter.voting_code)} className="text-gray-400 hover:text-primary-600">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{voter.department || '—'}</td>
                    <td className="px-4 py-3">
                      {voter.has_voted ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Voted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!voter.has_voted && (
                          <>
                            <button onClick={() => handleRegenCode(voter.id)} className="text-gray-400 hover:text-primary-600 p-1" title="Regenerate Code">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(voter.id)} className="text-gray-400 hover:text-red-600 p-1" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVoters.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                {searchQuery ? 'No voters match your search.' : 'No voters added yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Voter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Voter</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddVoter} className="space-y-4">
              <div>
                <label className="label">Matric Number</label>
                <input type="text" value={formData.matric_number} onChange={(e) => setFormData({ ...formData, matric_number: e.target.value })} className="input-field" placeholder="MAT/2024/001" required />
              </div>
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Student name" required />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="email@example.com" />
              </div>
              <div>
                <label className="label">Department (optional)</label>
                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input-field" placeholder="e.g., Medicine" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Add Voter</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bulk Import Voters</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Enter one voter per line in CSV format: <code className="bg-gray-100 px-1 rounded text-xs">matric_number, name, email, department</code>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="input-field !h-40 font-mono text-sm resize-none"
              placeholder="MAT/2024/051, John Doe, john@email.com, Medicine&#10;MAT/2024/052, Jane Smith, jane@email.com, Law&#10;MAT/2024/053, Ibrahim Yusuf, , Engineering"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleBulkAdd} className="btn-primary flex-1">Import Voters</button>
              <button onClick={() => setShowBulkModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
