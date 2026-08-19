import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';
import {
  Video, CalendarDays, FileText, HelpCircle, LogOut, MessageSquare,
  GraduationCap, Download, CheckCircle2, Clock, XCircle, User
} from 'lucide-react';

export default function StudentDash() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('notes');

  const [data, setData] = useState({ notes: [], tickets: [], appts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Guidance Request Form State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', requestedDate: '', requestedTime: ''
  });
  
  // Socket Ref
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(s);
    if (user) {
      s.emit('joinRoom', { userId: user._id || user.id, role: user.role });
    }
    
    s.on('ticket:created', handleTicketUpdate);
    s.on('ticket:assigned', handleTicketUpdate);
    s.on('ticket:accepted', handleTicketUpdate);
    s.on('ticket:scheduled', handleTicketUpdate);
    s.on('ticket:started', handleTicketUpdate);
    s.on('ticket:completed', handleTicketUpdate);
    s.on('ticket:cancelled', handleTicketUpdate);
    s.on('ticket:rejected', handleTicketUpdate);
    
    s.on('appointment:created', (newAppt) => {
      setData(prev => ({ ...prev, appts: [newAppt, ...prev.appts.filter(a => a._id !== newAppt._id)] }));
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  const handleTicketUpdate = (updatedTicket) => {
    setData((prev) => {
      const existing = prev.tickets.find(t => t._id === updatedTicket._id);
      if (existing) {
        return { ...prev, tickets: prev.tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t) };
      }
      return { ...prev, tickets: [updatedTicket, ...prev.tickets] };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [notesRes, ticketsRes, apptsRes] = await Promise.all([
          api.get('/notes'),
          api.get('/guidance-requests'),
          api.get('/appointments')
        ]);

        setData({
          notes: notesRes.data,
          tickets: ticketsRes.data,
          appts: apptsRes.data
        });
        setError(null);
      } catch (err) {
        setError('Unable to load data. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openRequestForm = (note) => {
    setSelectedNote(note);
    setShowRequestForm(true);
  };

  const closeRequestForm = () => {
    setSelectedNote(null);
    setShowRequestForm(false);
    setForm({ title: '', description: '', priority: 'medium', requestedDate: '', requestedTime: '' });
  };

  const handleGuidanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNote) return;
    try {
      await api.post('/guidance-requests', {
        noteId: selectedNote._id,
        title: form.title,
        description: form.description,
        priority: form.priority,
        requestedDate: form.requestedDate,
        requestedTime: form.requestedTime
      });
      // Ticket is added via Socket event
      closeRequestForm();
      setTab('tickets');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting request');
    }
  };

  const handleCancelTicket = async (id) => {
    try {
      await api.put(`/guidance-requests/${id}/cancel`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling request');
    }
  };

  if (loading) return <div className="p-10 flex justify-center text-indigo-600">Loading data...</div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800 relative">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white p-6 shadow-sm border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Student Portal</h1>
              <p className="text-xs font-semibold text-indigo-600">{user?.name || 'Student'}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'notes', label: 'Study Notes', icon: <FileText size={20} /> },
              { id: 'tickets', label: 'Guidance Requests', icon: <HelpCircle size={20} /> },
              { id: 'appointments', label: 'Appointments', icon: <CalendarDays size={20} /> }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 space-y-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => navigate('/chat')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-sm transition"
          >
            <MessageSquare size={20} /> Chats & Messages
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
            {error} <button onClick={() => window.location.reload()} className="underline font-bold ml-2">Retry</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 capitalize">{tab.replace('-', ' ')} Hub</h2>
            <p className="text-sm text-gray-500">Manage your course notes, appointments, and technical support requests</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
            Student View
          </span>
        </div>

        {tab === 'notes' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.notes.map((n) => (
              <div key={n._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">{n.subject}</span>
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{n.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <User size={14} /> Uploaded by: {n.uploadedBy?.name || 'Faculty'}
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  <a
                    href={n.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-bold transition duration-200"
                  >
                    <Download size={16} /> View / Download PDF
                  </a>
                  <button
                    onClick={() => openRequestForm(n)}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-sm font-bold transition duration-200"
                  >
                    <HelpCircle size={16} /> Request Faculty Guidance
                  </button>
                </div>
              </div>
            ))}
            {data.notes.length === 0 && <p className="text-gray-500">No study notes available.</p>}
          </div>
        )}

        {tab === 'tickets' && (
          <div className="space-y-4 max-w-4xl">
            {data.tickets.map((t) => (
              <div key={t._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-extrabold text-gray-900 text-lg">{t.title}</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-black capitalize bg-indigo-100 text-indigo-700">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{t.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Faculty:</strong> {t.facultyId?.name}</p>
                    <p><strong>Material:</strong> {t.noteId?.title || 'Unknown'}</p>
                    {t.status === 'done' && <p className="text-green-600 mt-2"><strong>Resolution:</strong> {t.resolution}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {['pending', 'assigned'].includes(t.status) && (
                    <button 
                      onClick={() => handleCancelTicket(t._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
            {data.tickets.length === 0 && <p className="text-gray-500">No guidance requests yet.</p>}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-4 max-w-4xl">
            {data.appts.map((a) => (
              <div key={a._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">{a.facultyId?.name || 'Faculty'}</h4>
                    <p className="text-xs font-medium text-gray-500 mt-1">
                      📅 Date: {new Date(a.date).toLocaleDateString()} | Time: {a.startTime} | Agenda: {a.agenda}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black capitalize ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {a.status}
                  </span>
                </div>
                {a.status === 'confirmed' && a.meetingLink && (
                  <a
                    href={a.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition"
                  >
                    <Video size={18} /> Join Video Session
                  </a>
                )}
              </div>
            ))}
            {data.appts.length === 0 && <p className="text-gray-500">No appointments yet.</p>}
          </div>
        )}
      </main>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Request Guidance</h3>
              <button onClick={closeRequestForm}><XCircle className="text-gray-400 hover:text-gray-700" /></button>
            </div>
            <form onSubmit={handleGuidanceSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-700">Faculty: {selectedNote?.uploadedBy?.name}</p>
                <p className="text-sm font-bold text-gray-700">Material: {selectedNote?.title}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Issue / Question</label>
                <input required placeholder="Brief title..." className="w-full p-2.5 border rounded-lg mb-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <textarea required placeholder="Detailed description..." rows={3} className="w-full p-2.5 border rounded-lg" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Preferred Date (Optional)</label>
                  <input type="date" className="w-full p-2.5 border rounded-lg" value={form.requestedDate} onChange={e => setForm({...form, requestedDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Preferred Time (Optional)</label>
                  <input type="time" className="w-full p-2.5 border rounded-lg" value={form.requestedTime} onChange={e => setForm({...form, requestedTime: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4">
                Submit Guidance Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
