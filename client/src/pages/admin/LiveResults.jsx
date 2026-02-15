import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import { ArrowLeft, Users, Vote, TrendingUp, Clock, RefreshCw, Wifi, WifiOff, Trophy, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'
];

export default function LiveResults() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // 1. Get Election Details
      const { data: election } = await supabase.from('elections').select('*').eq('id', id).single();
      
      // 2. Get Stats (Voters & Votes)
      const { count: totalVoters } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', id);
      const { count: votesCast } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('election_id', id);

      // 3. Get Positions & Candidates
      const { data: positions } = await supabase.from('positions').select('*, candidates(*)').eq('election_id', id);

      // 4. Calculate Results
      const { data: allVotes } = await supabase.from('votes').select('position_id, candidate_id').eq('election_id', id);
      
      const voteCounts = {};
      allVotes.forEach(vote => {
          if (!voteCounts[vote.candidate_id]) voteCounts[vote.candidate_id] = 0;
          voteCounts[vote.candidate_id]++;
      });

      const formattedPositions = positions.map(pos => {
        const candidates = pos.candidates.map(cand => ({
            ...cand,
            vote_count: voteCounts[cand.id] || 0
        }));
        
        const total_votes = candidates.reduce((sum, c) => sum + c.vote_count, 0);
        
        // Add percentage
        candidates.forEach(c => {
            c.percentage = total_votes > 0 ? ((c.vote_count / total_votes) * 100).toFixed(1) : 0;
        });
        
        // Sort by votes
        candidates.sort((a,b) => b.vote_count - a.vote_count);

        return {
           ...pos,
           candidates,
           total_votes
        };
      });

      setStats({
        election,
        total_voters: totalVoters,
        votes_cast: votesCast,
        turnout_percentage: totalVoters ? ((votesCast / totalVoters) * 100).toFixed(1) : 0,
        department_breakdown: [] // Placeholder
      });

      setResults({ positions: formattedPositions });
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    
    // Realtime Subscription
    const subscription = supabase
      .channel('public:votes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `election_id=eq.${id}` }, (payload) => {
        // Optimistic update or reload? Reload is safer for consistency
        loadData();
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadData, id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to={`/admin/elections/${id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Election Results</h1>
            <p className="text-sm text-gray-500">{stats?.election?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Live' : 'Reconnecting...'}
          </div>
          <span className="text-xs text-gray-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button onClick={loadData} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_voters || 0}</p>
              <p className="text-xs text-gray-500">Total Voters</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.votes_cast || 0}</p>
              <p className="text-xs text-gray-500">Votes Cast</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.turnout_percentage || 0}%</p>
              <p className="text-xs text-gray-500">Turnout</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{stats?.election?.status}</p>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Turnout Progress */}
      <div className="card p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Voter Turnout</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(stats?.turnout_percentage || 0, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold text-gray-900 w-16 text-right">{stats?.turnout_percentage || 0}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {stats?.votes_cast || 0} out of {stats?.total_voters || 0} eligible voters have cast their ballots
        </p>
      </div>

      {/* Department Breakdown */}
      {stats?.department_breakdown?.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Turnout by Department</h3>
          <div className="grid gap-3">
            {stats.department_breakdown.map((dept, i) => {
              const pct = dept.total > 0 ? Math.round((dept.voted / dept.total) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-32 truncate">{dept.department}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-20 text-right">{dept.voted}/{dept.total} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Position Results */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Results by Position
      </h2>

      <div className="grid gap-6">
        {results?.positions?.map((position) => {
          const chartData = {
            labels: position.candidates.map(c => c.name),
            datasets: [{
              data: position.candidates.map(c => c.vote_count),
              backgroundColor: position.candidates.map((_, i) => COLORS[i % COLORS.length]),
              borderWidth: 0,
              borderRadius: 6
            }]
          };

          const doughnutData = {
            labels: position.candidates.map(c => c.name),
            datasets: [{
              data: position.candidates.map(c => c.vote_count),
              backgroundColor: position.candidates.map((_, i) => COLORS[i % COLORS.length]),
              borderWidth: 3,
              borderColor: '#fff'
            }]
          };

          const maxVotes = Math.max(...position.candidates.map(c => c.vote_count), 1);
          const leader = position.candidates[0];

          return (
            <div key={position.id} className="card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{position.title}</h3>
                    <p className="text-sm text-gray-500">{position.total_votes} total votes</p>
                  </div>
                  {leader && leader.vote_count > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      <Trophy className="w-4 h-4" />
                      Leading: {leader.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Bar Chart */}
                  <div>
                    <div className="space-y-4">
                      {position.candidates.map((candidate, i) => (
                        <div key={candidate.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">{candidate.name}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {candidate.vote_count} ({candidate.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                            <div
                              className="h-8 rounded-full transition-all duration-1000 ease-out flex items-center px-3"
                              style={{
                                width: `${Math.max((candidate.vote_count / maxVotes) * 100, candidate.vote_count > 0 ? 8 : 0)}%`,
                                backgroundColor: COLORS[i % COLORS.length]
                              }}
                            >
                              {candidate.vote_count > 0 && (
                                <span className="text-white text-xs font-semibold whitespace-nowrap">
                                  {candidate.vote_count} votes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Doughnut Chart */}
                  <div className="flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Doughnut
                        data={doughnutData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } }
                            }
                          },
                          cutout: '60%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
