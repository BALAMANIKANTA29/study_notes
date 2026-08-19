import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import api from '../api';
import { ArrowLeft, Send, MessageSquare, User, Circle } from 'lucide-react';

const MOCK_CHAT_USERS = [
  { _id: 'f1', name: 'Dr. Kevin Shah', role: 'faculty', department: 'Computer Science' },
  { _id: 'f2', name: 'Dr. Anjali Nair', role: 'faculty', department: 'Mechanical' },
  { _id: 's1', name: 'Aditi Rao', role: 'student', department: 'Computer Science' }
];

const MOCK_INITIAL_MESSAGES = [
  { senderId: 'f1', text: 'Hi Aditi, happy to go over Chapter 4 during our call Friday.' },
  { senderId: 's1', text: "Thank you Dr. Shah! I've uploaded my draft solution as well." }
];

export default function Chat() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chatUsers, setChatUsers] = useState(MOCK_CHAT_USERS);
  const [selectedUser, setSelectedUser] = useState(MOCK_CHAT_USERS[0]);
  const [messages, setMessages] = useState(MOCK_INITIAL_MESSAGES);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUserId = user?._id || user?.id || 's1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Socket initialization
    socketRef.current = io('http://localhost:5000', { reconnectionAttempts: 3 });

    if (currentUserId) {
      socketRef.current.emit('joinRoom', currentUserId);
    }

    socketRef.current.on('receiveMessage', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Fetch user contacts list
    const loadUsers = async () => {
      try {
        const res = await api.get('/users');
        if (res.data && res.data.length > 0) {
          const filtered = res.data.filter((u) => u._id !== currentUserId);
          setChatUsers(filtered.length ? filtered : MOCK_CHAT_USERS);
          if (filtered.length) setSelectedUser(filtered[0]);
        }
      } catch (err) {
        console.warn('Using fallback chat users');
      }
    };

    loadUsers();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUserId]);

  // Load message history when selecting a user
  useEffect(() => {
    if (!selectedUser) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/${selectedUser._id}`);
        if (res.data && res.data.length > 0) {
          setMessages(res.data);
        } else {
          setMessages(MOCK_INITIAL_MESSAGES);
        }
      } catch (err) {
        setMessages(MOCK_INITIAL_MESSAGES);
      }
    };
    fetchHistory();
  }, [selectedUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const msgPayload = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: text.trim()
    };

    // Emit socket event if connected
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', msgPayload);
    } else {
      // Local UI update
      setMessages((prev) => [...prev, msgPayload]);
    }

    setText('');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 font-sans">
      {/* Top Header */}
      <nav className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center shadow-md shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-extrabold hover:bg-indigo-700 px-3.5 py-2 rounded-xl text-sm transition"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <span className="font-extrabold text-sm sm:text-base">
            Campus Messenger — Connected as {user?.name || 'User'}
          </span>
        </div>

        <button onClick={logout} className="text-xs font-bold text-indigo-200 hover:text-white transition">
          Logout
        </button>
      </nav>

      {/* Main Chat Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* User Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-black text-xs uppercase text-gray-500 tracking-wider">Active Campus Contacts</h3>
          </div>
          {chatUsers.map((u) => {
            const isSelected = selectedUser?._id === u._id;
            return (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`p-4 cursor-pointer border-b border-gray-100 flex items-center gap-3 transition ${
                  isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative bg-indigo-100 text-indigo-700 p-2.5 rounded-full font-bold text-sm">
                  <User size={18} />
                  <Circle size={10} className="absolute bottom-0 right-0 fill-green-500 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{u.role} • {u.department || 'Campus'}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messaging Area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Header of Active Chat */}
          <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs shrink-0">
            <div>
              <h4 className="font-black text-gray-900">{selectedUser?.name || 'Chat'}</h4>
              <p className="text-xs text-gray-400 capitalize">{selectedUser?.role || 'User'} Contact</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <Circle size={8} className="fill-emerald-500 text-emerald-500" /> Live Socket Sync
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">
            {messages.map((m, i) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div
                  key={i}
                  className={`max-w-md p-4 rounded-2xl shadow-xs text-sm ${
                    isMine
                      ? 'bg-indigo-600 text-white self-end rounded-br-none font-medium'
                      : 'bg-white text-gray-800 self-start border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${selectedUser?.name || 'contact'}...`}
              className="flex-1 p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold transition flex items-center justify-center shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
