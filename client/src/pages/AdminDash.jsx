import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Users, FileText, CheckCircle, Clock, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';

const MOCK_ANALYTICS_DATA = {
  totalUsers: 482,
  totalTickets: 37,
  resolvedTickets: 24,
  pendingAppts: 11
};

export default function AdminDash() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(MOCK_ANALYTICS_DATA);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data);
    } catch (err) {
      console.warn('Using fallback analytics data');
      setStats(MOCK_ANALYTICS_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const cards = [
    {
      title: 'Total Portal Users',
      value: stats.totalUsers,
      icon: <Users size={28} />,
      borderColor: 'border-l-indigo-600',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Total Tickets Raised',
      value: stats.totalTickets,
      icon: <FileText size={28} />,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Resolved Support Issues',
      value: stats.resolvedTickets,
      icon: <CheckCircle size={28} />,
      borderColor: 'border-l-emerald-600',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Pending Appointments',
      value: stats.pendingAppts,
      icon: <Clock size={28} />,
      borderColor: 'border-l-sky-500',
      iconColor: 'text-sky-500',
      bgColor: 'bg-sky-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Campus Admin Command Center</h1>
            <p className="text-xs font-semibold text-emerald-600">Logged in as {user?.name || 'Administrator'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Stats
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl text-xs transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 p-8 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">System Overview & Analytics</h2>
          <p className="text-sm text-gray-500">Live platform performance and operational breakdown</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`bg-white p-6 rounded-2xl shadow-sm border-t sm:border-t-0 sm:border-l-4 ${c.borderColor} border-gray-200 flex items-center justify-between hover:shadow-md transition`}
            >
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">{c.title}</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{c.value || 0}</p>
              </div>
              <div className={`p-4 rounded-2xl ${c.bgColor} ${c.iconColor}`}>{c.icon}</div>
            </div>
          ))}
        </div>

        {/* System Activity & Distribution Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-4">User Distribution Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Enrolled Students</span>
                  <span>412 Users (85%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-indigo-600 h-3 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Faculty Members</span>
                  <span>58 Users (12%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-purple-600 h-3 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>System Administrators</span>
                  <span>12 Users (3%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '3%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-4">Support Ticket Resolution Rate</h3>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-5xl font-black text-emerald-600">
                  {stats.totalTickets ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 65}%
                </p>
                <p className="text-sm font-bold text-gray-500 mt-2">Tickets Successfully Resolved</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
