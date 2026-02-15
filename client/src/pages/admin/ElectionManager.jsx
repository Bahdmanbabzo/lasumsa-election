import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createElection } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { Calendar, FileText, Type } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ElectionManager() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    setLoading(true);

    try {
      const { data } = await createElection({
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      });
      toast.success('Election created!');
      navigate(`/admin/elections/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create New Election">
      <div className="max-w-2xl">
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label flex items-center gap-2">
                <Type className="w-4 h-4" /> Election Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Student Union Election 2026"
                required
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field !h-28 resize-none"
                placeholder="Describe the election..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Create Election'}
              </button>
              <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
