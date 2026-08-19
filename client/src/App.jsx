import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDash from './pages/StudentDash';
import FacultyDash from './pages/FacultyDash';
import AdminDash from './pages/AdminDash';
import Chat from './pages/Chat';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDash /></ProtectedRoute>} />
      <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyDash /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDash /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={`/${user.role || 'student'}`} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
