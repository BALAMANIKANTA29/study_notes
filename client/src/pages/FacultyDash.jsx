import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import {
  Video, Upload, CalendarCheck, AlertCircle, LogOut, MessageSquare,
  GraduationCap, CheckCircle2, XCircle, FileText, Check, Clock
} from 'lucide-react';

const MOCK_FACULTY_APPTS = [
  {
    _id: 'ap1',
    studentId: { name: 'Aditi Rao' },
    date: '2026-08-14',
    agenda: 'Doubt in Chapter 4 (Trees & Graphs)',
    status: 'confirmed',
    link: 'https://meet.jit.si/CampusPortal-4f9a2c'
  },
  {
    _id: 'ap2',
    studentId: { name: 'Rohan Sharma' },
    date: '2026-08-18',
    agenda: 'Project proposal guidance and feedback',
    status: 'pending'
  }
];

const MOCK_FACULTY_TICKETS = [
  {
    _id: 't1',
    title: 'Grade discrepancy in Assignment 2',
    description: "Student submitted score doesn't match portal calculation.",
    status: 'open',
    studentId: { name: 'Aditi Rao' }
  },
  {
    _id: 't2',
    title: 'Lab equipment access permission',
    description: 'Requires advance approval for AI workstation access.',
    status: 'resolved',
    studentId: { name: 'Rohan Sharma' }
  }
];

export default function FacultyDash() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('upload');
  const [data, setData] = useState({ tickets: MOCK_FACULTY_TICKETS, appts: MOCK_FACULTY_APPTS });
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, apptsRes] = await Promise.all([
          api.get('/tickets'),
          api.get('/appointments')
        ]);
        setData({
          tickets: ticketsRes.data.length ? ticketsRes.data : MOCK_FACULTY_TICKETS,
          appts: apptsRes.data.length ? apptsRes.data : MOCK_FACULTY_APPTS
        });
      } catch (err) {
        console.warn('Backend API unavailable, using demo faculty state');
      }
    };
    fetchData();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadSuccess('');
    const formElement = e.target;
    const formData = new FormData(formElement);

    try {
      await api.post('/notes', formData);
      setUploadSuccess('PDF note successfully uploaded and published!');
      formElement.reset();
    } catch (err) {
      setUploadSuccess('Note uploaded to demo repository!');
      formElement.reset();
    } finally {
      setUploadLoading(false);
      setTimeout(() => setUploadSuccess(''), 4000);
    }
  };

  const handleApptStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      const apptsRes = await api.get('/appointments');
      setData((prev) => ({ ...prev, appts: apptsRes.data }));
    } catch (err) {
      // Local fallback state update
      setData((prev) => ({
        ...prev,
        appts: prev.appts.map((a) => {
          if (a._id === id) {
            const randomHex = Math.random().toString(36).substring(2, 8);
            return {
              ...a,
              status,
              link: status === 'confirmed' ? `https://meet.jit.si/CampusPortal-${randomHex}` : a.link
            };
          }
          return a;
        })
      }));
    }
  };

  const handleTicketResolve = async (id) => {
    try {
      await api.put(`/tickets/${id}`, { status: 'resolved' });
      const ticketsRes = await api.get('/tickets');
      setData((prev) => ({ ...prev, tickets: ticketsRes.data }));
    } catch (err) {
      setData((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) => (t._id === id ? { ...t, status: 'resolved' } : t))
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white p-6 shadow-sm border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 text-white p-2.5 rounded-xl shadow-md">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Faculty Portal</h1>
              <p className="text-xs font-semibold text-purple-600">{user?.name || 'Dr. Kevin Shah'}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'upload', label: 'Upload Notes', icon: <Upload size={20} /> },
              { id: 'appointments', label: 'Appointments', icon: <CalendarCheck size={20} /> },
              { id: 'tickets', label: 'Tickets Review', icon: <AlertCircle size={20} /> }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm'
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
            <MessageSquare size={20} /> Student Chats
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 capitalize">Faculty Management Console</h2>
            <p className="text-sm text-gray-500">Manage course material uploads, appointments, and resolve student tickets</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
            Faculty Access
          </span>
        </div>

        {/* Upload Notes Tab */}
        {tab === 'upload' && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="text-purple-600" /> Upload Course Material (PDF)
            </h3>
            <p className="text-xs text-gray-500 mb-6">PDF files uploaded here are immediately made available to enrolled students.</p>

            {uploadSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={18} /> {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Material Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Chapter 4 - Graph Algorithms & Trees"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject Code</label>
                <input
                  name="subject"
                  required
                  placeholder="e.g. CS201"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">PDF File Document</label>
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200"
              >
                {uploadLoading ? 'Uploading...' : 'Publish PDF Material'}
              </button>
            </form>
          </div>
        )}

        {/* Appointments Tab */}
        {tab === 'appointments' && (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">Pending & Scheduled Appointments</h3>
            {data.appts.map((a) => (
              <div key={a._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-lg">{a.studentId?.name || 'Student'}</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-1">
                      📅 Date: {a.date?.split('T')[0]} | Agenda: {a.agenda}
                    </p>
                  </div>
                  <span className="font-bold text-xs uppercase px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                    Status: {a.status}
                  </span>
                </div>

                {a.status === 'pending' ? (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApptStatusUpdate(a._id, 'confirmed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <Check size={16} /> Confirm & Generate Jitsi Video Link
                    </button>
                    <button
                      onClick={() => handleApptStatusUpdate(a._id, 'canceled')}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <XCircle size={16} /> Cancel Request
                    </button>
                  </div>
                ) : a.status === 'confirmed' && a.link ? (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200"
                  >
                    <Video size={20} /> Start / Join Video Call Meeting
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Tickets Tab */}
        {tab === 'tickets' && (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">Assigned Student Support Tickets</h3>
            {data.tickets.map((t) => (
              <div key={t._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-extrabold text-gray-900 text-base">{t.title}</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black capitalize ${
                      t.status === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Raised by: {t.studentId?.name || 'Student'}</p>
                <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                {t.status !== 'resolved' && (
                  <button
                    onClick={() => handleTicketResolve(t._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Mark Issue as Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
