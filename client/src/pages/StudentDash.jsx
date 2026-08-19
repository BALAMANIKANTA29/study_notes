import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import {
  Video, CalendarDays, FileText, HelpCircle, LogOut, MessageSquare,
  GraduationCap, Download, PlusCircle, CheckCircle2, Clock, XCircle, User
} from 'lucide-react';

const MOCK_STUDENT_NOTES = [
  { _id: 'n1', title: 'Unit 3 - Data Structures & Algorithms', subject: 'CS201', uploadedBy: { name: 'Dr. Kevin Shah' }, fileUrl: '#' },
  { _id: 'n2', title: 'Thermodynamics & Heat Transfer Cheatsheet', subject: 'ME110', uploadedBy: { name: 'Dr. Anjali Nair' }, fileUrl: '#' },
  { _id: 'n3', title: 'Midterm Review & Exam Practice Slides', subject: 'CS201', uploadedBy: { name: 'Dr. Kevin Shah' }, fileUrl: '#' }
];

const MOCK_FACULTY_LIST = [
  { _id: 'f1', name: 'Dr. Kevin Shah', department: 'Computer Science' },
  { _id: 'f2', name: 'Dr. Anjali Nair', department: 'Mechanical Engineering' }
];

const MOCK_APPTS_INITIAL = [
  {
    _id: 'ap1',
    facultyId: { name: 'Dr. Kevin Shah' },
    date: '2026-08-14',
    time: '10:00 AM',
    agenda: 'Doubt in Binary Trees & Graph Traversal',
    status: 'confirmed',
    link: 'https://meet.jit.si/CampusPortal-4f9a2c'
  },
  {
    _id: 'ap2',
    facultyId: { name: 'Dr. Anjali Nair' },
    date: '2026-08-18',
    time: '02:30 PM',
    agenda: 'Final Year Project Guidance Session',
    status: 'pending'
  }
];

const MOCK_TICKETS_INITIAL = [
  {
    _id: 't1',
    title: 'Grade discrepancy in Assignment 2',
    description: 'Submitted score does not reflect the graded rubric on portal.',
    status: 'open',
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    _id: 't2',
    title: 'Digital library access issue',
    description: 'Unable to authenticate off-campus VPN credentials.',
    status: 'resolved',
    priority: 'low',
    createdAt: new Date().toISOString()
  }
];

export default function StudentDash() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('notes');

  const [data, setData] = useState({
    notes: MOCK_STUDENT_NOTES,
    tickets: MOCK_TICKETS_INITIAL,
    appts: MOCK_APPTS_INITIAL,
    faculty: MOCK_FACULTY_LIST
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    facultyId: '',
    date: '',
    agenda: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesRes, ticketsRes, apptsRes, facultyRes] = await Promise.all([
          api.get('/notes'),
          api.get('/tickets'),
          api.get('/appointments'),
          api.get('/users?role=faculty')
        ]);

        setData({
          notes: notesRes.data.length ? notesRes.data : MOCK_STUDENT_NOTES,
          tickets: ticketsRes.data.length ? ticketsRes.data : MOCK_TICKETS_INITIAL,
          appts: apptsRes.data.length ? apptsRes.data : MOCK_APPTS_INITIAL,
          faculty: facultyRes.data.length ? facultyRes.data : MOCK_FACULTY_LIST
        });
      } catch (err) {
        console.warn('Backend API unavailable, displaying demo data state');
      }
    };
    fetchData();
  }, []);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    try {
      const res = await api.post('/tickets', { title: form.title, description: form.description, priority: form.priority });
      setData((prev) => ({ ...prev, tickets: [res.data, ...prev.tickets] }));
    } catch (err) {
      const newTicket = {
        _id: `t_${Date.now()}`,
        title: form.title,
        description: form.description,
        status: 'open',
        priority: form.priority
      };
      setData((prev) => ({ ...prev, tickets: [newTicket, ...prev.tickets] }));
    }
    setForm((prev) => ({ ...prev, title: '', description: '' }));
  };

  const handleApptSubmit = async (e) => {
    e.preventDefault();
    if (!form.facultyId || !form.date || !form.agenda) return;
    const facultyObj = data.faculty.find((f) => f._id === form.facultyId) || { name: 'Faculty Member' };

    try {
      const res = await api.post('/appointments', { facultyId: form.facultyId, date: form.date, agenda: form.agenda });
      setData((prev) => ({ ...prev, appts: [res.data, ...prev.appts] }));
    } catch (err) {
      const newAppt = {
        _id: `ap_${Date.now()}`,
        facultyId: { name: facultyObj.name },
        date: form.date,
        agenda: form.agenda,
        status: 'pending'
      };
      setData((prev) => ({ ...prev, appts: [newAppt, ...prev.appts] }));
    }
    setForm((prev) => ({ ...prev, date: '', agenda: '', facultyId: '' }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white p-6 shadow-sm border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">Student Portal</h1>
              <p className="text-xs font-semibold text-indigo-600">{user?.name || 'Aditi Rao'}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'notes', label: 'Study Notes', icon: <FileText size={20} /> },
              { id: 'appointments', label: 'Appointments', icon: <CalendarDays size={20} /> },
              { id: 'tickets', label: 'Support Tickets', icon: <HelpCircle size={20} /> }
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
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 capitalize">{tab} Hub</h2>
            <p className="text-sm text-gray-500">Manage your course notes, appointments, and technical support requests</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
            Student View
          </span>
        </div>

        {/* Tab 1: Notes */}
        {tab === 'notes' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.notes.map((n) => (
              <div
                key={n._id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg">
                      {n.subject}
                    </span>
                    <FileText size={18} className="text-gray-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">
                    {n.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <User size={14} /> Uploaded by: {n.uploadedBy?.name || 'Faculty'}
                  </p>
                </div>
                <a
                  href={n.fileUrl !== '#' ? n.fileUrl : '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (n.fileUrl === '#') {
                      e.preventDefault();
                      alert(`Downloading PDF note: "${n.title}"`);
                    }
                  }}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-sm font-bold transition duration-200"
                >
                  <Download size={16} /> Download PDF Note
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Appointments */}
        {tab === 'appointments' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-indigo-600" /> Book Appointment
              </h3>
              <form onSubmit={handleApptSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Select Faculty</label>
                  <select
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    value={form.facultyId}
                    onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                  >
                    <option value="">Choose a Faculty Member</option>
                    {data.faculty.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Preferred Date</label>
                  <input
                    required
                    type="date"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Meeting Agenda</label>
                  <input
                    required
                    placeholder="e.g. Doubts on Chapter 4 Trees"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.agenda}
                    onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition"
                >
                  Submit Request
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-black text-gray-900 mb-4">Your Appointment Requests</h3>
              {data.appts.map((a) => (
                <div key={a._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-base">{a.facultyId?.name || 'Faculty'}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        📅 {a.date?.split('T')[0]} | Agenda: {a.agenda}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-center capitalize ${
                        a.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'canceled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  {a.status === 'confirmed' && a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200"
                    >
                      <Video size={20} /> Join Jitsi Instant Call Room
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Tickets */}
        {tab === 'tickets' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <PlusCircle size={20} className="text-indigo-600" /> Raise Support Ticket
              </h3>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Issue Title</label>
                  <input
                    required
                    placeholder="e.g. Portal Login Error"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Priority</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the issue you are experiencing..."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition"
                >
                  Submit Ticket
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-black text-gray-900 mb-4">Support Ticket History</h3>
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
                  <p className="text-sm text-gray-600 mb-3">{t.description}</p>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Priority: {t.priority || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
