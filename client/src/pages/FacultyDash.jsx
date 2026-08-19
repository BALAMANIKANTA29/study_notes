import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';
import {
  Video, Upload, CalendarCheck, AlertCircle, LogOut, MessageSquare,
  GraduationCap, CheckCircle2, XCircle, FileText, Clock, Settings
} from 'lucide-react';

export default function FacultyDash() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('tickets');
  const [data, setData] = useState({ tickets: [], appts: [], availabilities: [] });
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resolution/Scheduling Modal State
  const [modalMode, setModalMode] = useState(null); // 'schedule' | 'resolve'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalForm, setModalForm] = useState({ date: '', startTime: '', endTime: '', resolution: '' });

  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    if (user) s.emit('joinRoom', { userId: user._id || user.id, role: user.role });
    
    const handleUpdate = (updatedTicket) => {
      setData((prev) => {
        const existing = prev.tickets.find(t => t._id === updatedTicket._id);
        if (existing) return { ...prev, tickets: prev.tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t) };
        return { ...prev, tickets: [updatedTicket, ...prev.tickets] };
      });
    };

    s.on('ticket:created', handleUpdate);
    s.on('ticket:assigned', handleUpdate);
    s.on('ticket:accepted', handleUpdate);
    s.on('ticket:scheduled', handleUpdate);
    s.on('ticket:started', handleUpdate);
    s.on('ticket:completed', handleUpdate);
    s.on('ticket:cancelled', handleUpdate);
    s.on('ticket:rejected', handleUpdate);
    
    s.on('appointment:created', (newAppt) => {
      setData(prev => ({ ...prev, appts: [newAppt, ...prev.appts.filter(a => a._id !== newAppt._id)] }));
    });

    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, apptsRes, availRes] = await Promise.all([
          api.get('/guidance-requests'),
          api.get('/appointments'),
          api.get(`/faculty/${user._id || user.id}/availability`)
        ]);
        setData({ tickets: ticketsRes.data, appts: apptsRes.data, availabilities: availRes.data });
      } catch (err) {
        setError('Unable to load data. Please retry.');
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadSuccess('');
    const formElement = e.target;
    const formData = new FormData(formElement);

    try {
      await api.post('/notes', formData);
      setUploadSuccess('PDF note successfully published!');
      formElement.reset();
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading file');
    } finally {
      setUploadLoading(false);
      setTimeout(() => setUploadSuccess(''), 4000);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/guidance-requests/${id}/${action}`);
    } catch (err) {
      alert(err.response?.data?.message || `Error attempting to ${action}`);
    }
  };

  const openModal = (mode, ticket) => {
    setModalMode(mode);
    setSelectedTicket(ticket);
    setModalForm({ date: '', startTime: '', endTime: '', resolution: '' });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'schedule') {
        await api.put(`/guidance-requests/${selectedTicket._id}/schedule`, {
          date: modalForm.date,
          startTime: modalForm.startTime,
          endTime: modalForm.endTime
        });
      } else if (modalMode === 'resolve') {
        await api.put(`/guidance-requests/${selectedTicket._id}/complete`, {
          resolution: modalForm.resolution
        });
      }
      setModalMode(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800">
      <aside className="w-full md:w-64 bg-white p-6 shadow-sm border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 text-white p-2.5 rounded-xl shadow-md">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Faculty Portal</h1>
              <p className="text-xs font-semibold text-purple-600">{user?.name || 'Faculty'}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'tickets', label: 'Guidance Requests', icon: <AlertCircle size={20} /> },
              { id: 'appointments', label: 'Appointments', icon: <CalendarCheck size={20} /> },
              { id: 'upload', label: 'Upload Notes', icon: <Upload size={20} /> }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  tab === t.id ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-8 space-y-2 pt-4 border-t border-gray-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 capitalize">{tab.replace('-', ' ')}</h2>
            <p className="text-sm text-gray-500">Manage course material, appointments, and student guidance</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Faculty Access</span>
        </div>

        {tab === 'tickets' && (
          <div className="space-y-4 max-w-4xl">
            {data.tickets.map((t) => (
              <div key={t._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-gray-900 text-base">{t.title}</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-black capitalize bg-purple-100 text-purple-700">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-2">Student: {t.studentId?.name} | Material: {t.noteId?.title}</p>
                  <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                  
                  {['assigned', 'pending'].includes(t.status) && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(t._id, 'accept')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm">Accept</button>
                      <button onClick={() => handleAction(t._id, 'reject')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl">Reject</button>
                    </div>
                  )}
                  {t.status === 'accepted' && (
                    <button onClick={() => openModal('schedule', t)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm">Schedule Appointment</button>
                  )}
                  {t.status === 'scheduled' && (
                    <button onClick={() => handleAction(t._id, 'start')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm">Start Session</button>
                  )}
                  {t.status === 'in_session' && (
                    <button onClick={() => openModal('resolve', t)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm">Mark as Done (Complete)</button>
                  )}
                </div>
              </div>
            ))}
            {data.tickets.length === 0 && <p className="text-gray-500">No pending guidance requests.</p>}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-4 max-w-4xl">
            {data.appts.map((a) => (
              <div key={a._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-lg">{a.studentId?.name || 'Student'}</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-1">
                      📅 Date: {new Date(a.date).toLocaleDateString()} | Time: {a.startTime} | Agenda: {a.agenda}
                    </p>
                  </div>
                  <span className={`font-bold text-xs uppercase px-3 py-1 rounded-full ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </div>
                {a.status === 'confirmed' && a.meetingLink && (
                  <a href={a.meetingLink} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition w-full sm:w-auto">
                    <Video size={18} /> Start Video Meeting
                  </a>
                )}
              </div>
            ))}
            {data.appts.length === 0 && <p className="text-gray-500">No scheduled appointments.</p>}
          </div>
        )}

        {tab === 'upload' && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="text-purple-600" /> Upload Course Material (PDF)
            </h3>
            {uploadSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 size={18} /> {uploadSuccess}
              </div>
            )}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Title</label>
                <input name="title" required placeholder="Chapter 1..." className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject</label>
                <input name="subject" required placeholder="CS101" className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">PDF File</label>
                <input name="file" type="file" required accept=".pdf" className="w-full p-3 border rounded-xl" />
              </div>
              <button type="submit" disabled={uploadLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-md transition">
                {uploadLoading ? 'Uploading...' : 'Publish PDF Material'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modals */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{modalMode === 'schedule' ? 'Schedule Appointment' : 'Complete Session'}</h3>
              <button onClick={() => setModalMode(null)}><XCircle className="text-gray-400 hover:text-gray-700" /></button>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalMode === 'schedule' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold">Date</label><input type="date" required className="w-full p-2.5 border rounded-lg" value={modalForm.date} onChange={e => setModalForm({...modalForm, date: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold">Start Time</label><input type="time" required className="w-full p-2.5 border rounded-lg" value={modalForm.startTime} onChange={e => setModalForm({...modalForm, startTime: e.target.value})} /></div>
                  </div>
                </>
              ) : (
                <div><label className="block text-xs font-bold">Resolution Notes</label><textarea required rows={4} className="w-full p-2.5 border rounded-lg mt-1" value={modalForm.resolution} onChange={e => setModalForm({...modalForm, resolution: e.target.value})} placeholder="Session summary..."></textarea></div>
              )}
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl mt-4">Submit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
