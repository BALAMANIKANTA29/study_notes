import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, UserCheck, Sparkles, BookOpen } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loginDemoRole } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-4">
      <div className="bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 transition-all duration-300">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600 shadow-inner">
            <GraduationCap size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Unified Campus Portal — Access Notes, Appointments, Support & Chat
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  required
                  placeholder="Aditi Rao"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address</label>
            <input
              required
              type="email"
              placeholder="user@campus.edu"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.99] transition duration-150 shadow-lg shadow-indigo-200"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {import.meta.env.VITE_ENABLE_DEMO_MODE === 'true' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-semibold">Or Quick Demo Login</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => loginDemoRole('student')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
              >
                <BookOpen size={16} className="mb-1" /> Student
              </button>

              <button
                type="button"
                onClick={() => loginDemoRole('faculty')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition"
              >
                <UserCheck size={16} className="mb-1" /> Faculty
              </button>

              <button
                type="button"
                onClick={() => loginDemoRole('admin')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition"
              >
                <ShieldCheck size={16} className="mb-1" /> Admin
              </button>
            </div>
          </>
        )}

        <p
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          className="text-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline transition"
        >
          {isRegister ? 'Already registered? Log in here' : "Don't have an account? Register now"}
        </p>
      </div>
    </div>
  );
}
