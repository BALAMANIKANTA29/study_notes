import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';
import { Users, FileText, CheckCircle, Clock, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AdminDash() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalUsers: 0, totalTickets: 0, resolvedTickets: 0, pendingAppts: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    if (user) s.emit('joinRoom', { userId: user._id || user.id, role: user.role });
    
    const handleUpdate = (updatedTicket) => {
      setTickets((prev) => {
        const existing = prev.find(t => t._id === updatedTicket._id);
        if (existing) return prev.map(t => t._id === updatedTicket._id ? updatedTicket : t);
        return [updatedTicket, ...prev];
      });
      fetchAnalytics();
    };

    s.on('ticket:created', handleUpdate);
    s.on('ticket:assigned', handleUpdate);
    s.on('ticket:accepted', handleUpdate);
    s.on('ticket:scheduled', handleUpdate);
    s.on('ticket:started', handleUpdate);
    s.on('ticket:completed', handleUpdate);
    s.on('ticket:cancelled', handleUpdate);
    s.on('ticket:rejected', handleUpdate);

    return () => s.disconnect();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/guidance-requests')
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
      setError(null);
    } catch (err) {
      setError('Unable to load dashboard data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Portal Users', value: stats.totalUsers, icon: <Users size={28} />, borderColor: 'border-l-indigo-600', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { title: 'Total Tickets Raised', value: stats.totalTickets, icon: <FileText size={28} />, borderColor: 'border-l-amber-500', iconColor: 'text-amber-500', bgColor: 'bg-amber-50' },
    { title: 'Resolved Issues', value: stats.resolvedTickets, icon: <CheckCircle size={28} />, borderColor: 'border-l-emerald-600', iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { title: 'Pending Appointments', value: stats.pendingAppts, icon: <Clock size={28} />, borderColor: 'border-l-sky-500', iconColor: 'text-sky-500', bgColor: 'bg-sky-50' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Admin Command Center</h1>
            <p className="text-xs font-semibold text-emerald-600">Logged in as {user?.name || 'Administrator'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Stats
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl text-xs transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${c.borderColor} border-gray-200 flex items-center justify-between hover:shadow-md transition`}>
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">{c.title}</p>
                <p className="text-4xl font-black text-gray-900 mt-2">{c.value || 0}</p>
              </div>
              <div className={`p-4 rounded-2xl ${c.bgColor} ${c.iconColor}`}>{c.icon}</div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">All Guidance Requests (Operations View)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="p-3 font-bold">Ticket ID</th>
                  <th className="p-3 font-bold">Student</th>
                  <th className="p-3 font-bold">Faculty</th>
                  <th className="p-3 font-bold">Priority</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="p-3 font-mono text-xs">{t._id.slice(-6)}</td>
                    <td className="p-3 font-medium">{t.studentId?.name || 'Unknown'}</td>
                    <td className="p-3 font-medium">{t.facultyId?.name || 'Unknown'}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold uppercase ${t.priority === 'high' ? 'text-red-600' : 'text-gray-600'}`}>{t.priority}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold capitalize">{t.status.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">No requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
