import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Vote, LayoutDashboard, LogOut, Plus, BarChart3, Users, Settings } from 'lucide-react';

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 hidden sm:block">LASUMSA Elections</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin/elections/new" className="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Election</span>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
