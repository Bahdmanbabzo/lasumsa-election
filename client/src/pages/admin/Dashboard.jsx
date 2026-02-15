import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getElections } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Vote, Users, BarChart3, Clock, CheckCircle, XCircle, FileEdit, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileEdit },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle }
};

export default function Dashboard() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      const { data } = await getElections();
      setElections(data);
    } catch (err) {
      toast.error('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const totalVoters = elections.reduce((sum, e) => sum + (e.total_voters || 0), 0);
  const totalVotes = elections.reduce((sum, e) => sum + (e.votes_cast || 0), 0);
  const activeElections = elections.filter(e => e.status === 'active').length;

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Elections', value: elections.length, icon: Vote, color: 'bg-primary-500' },
          { label: 'Active Elections', value: activeElections, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Total Voters', value: totalVoters, icon: Users, color: 'bg-purple-500' },
          { label: 'Votes Cast', value: totalVotes, icon: BarChart3, color: 'bg-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Elections List */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Your Elections</h2>
        <Link to="/admin/elections/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Create Election
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : elections.length === 0 ? (
        <div className="card p-12 text-center">
          <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Elections Yet</h3>
          <p className="text-gray-500 mb-6">Create your first election to get started.</p>
          <Link to="/admin/elections/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Election
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {elections.map((election) => {
            const status = statusConfig[election.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            const turnout = election.total_voters > 0
              ? Math.round((election.votes_cast / election.total_voters) * 100)
              : 0;

            return (
              <div key={election.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{election.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {election.total_voters} voters
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {election.votes_cast} votes ({turnout}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <Vote className="w-4 h-4" />
                        {election.total_positions} positions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/elections/${election.id}`} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" /> Manage
                    </Link>
                    {(election.status === 'active' || election.status === 'completed') && (
                      <Link to={`/admin/elections/${election.id}/results`} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" /> Results
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {election.total_voters > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Voter Turnout</span>
                      <span>{turnout}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${turnout}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
