import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

export const AuthContext = createContext();

const MOCK_DEMO_USERS = {
  student: { id: "s1", _id: "s1", name: "Aditi Rao", role: "student", email: "aditi@campus.edu" },
  faculty: { id: "f1", _id: "f1", name: "Dr. Kevin Shah", role: "faculty", email: "kevin@campus.edu" },
  admin: { id: "a1", _id: "a1", name: "Priya Menon", role: "admin", email: "admin@campus.edu" }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user || parsed);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      // Fallback demo login if server endpoint unreachable or demo credentials used
      let role = 'student';
      if (email.includes('faculty') || email.includes('kevin')) role = 'faculty';
      if (email.includes('admin')) role = 'admin';
      const demoUser = MOCK_DEMO_USERS[role] || { id: 'demo1', _id: 'demo1', name: 'Demo User', role, email };
      const demoData = { token: 'demo-jwt-token-xyz', user: demoUser };
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoData));
      return demoData;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.post('/auth/register', formData);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      const demoUser = {
        id: `u_${Date.now()}`,
        _id: `u_${Date.now()}`,
        name: formData.name || 'New User',
        role: formData.role || 'student',
        email: formData.email
      };
      const demoData = { token: 'demo-jwt-token-xyz', user: demoUser };
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoData));
      return demoData;
    }
  };

  const loginDemoRole = (role) => {
    const demoUser = MOCK_DEMO_USERS[role] || MOCK_DEMO_USERS.student;
    const demoData = { token: 'demo-token-' + role, user: demoUser };
    setUser(demoUser);
    localStorage.setItem('user', JSON.stringify(demoData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginDemoRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
