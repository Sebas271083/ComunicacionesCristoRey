import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useServiceWorker } from './hooks/useServiceWorker.js';
import { UpdateNotification } from './components/UpdateNotification.jsx';
import { LoginPage } from './modules/auth/LoginPage.jsx';
import { RegisterPage } from './modules/auth/RegisterPage.jsx';
import { ChatPage } from './modules/chat/ChatPage.jsx';
import { TasksPage } from './modules/tareas/TasksPage.jsx';
import { CalendarPage } from './modules/calendario/CalendarPage.jsx';
import { ProfilePage } from './modules/perfil/ProfilePage.jsx';
import { AnunciosPage } from './modules/anuncios/AnunciosPage.jsx';
import { AdminPage } from './modules/admin/AdminPage.jsx';

const PRIVILEGIADOS = ['admin', 'director', 'secretaria'];

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/chat" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return PRIVILEGIADOS.includes(user.rol) ? children : <Navigate to="/chat" replace />;
}

export default function App() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  return (
    <>
      <UpdateNotification available={updateAvailable} onUpdate={updateServiceWorker} />
      <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/tareas" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
      <Route path="/calendario" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
      <Route path="/anuncios" element={<PrivateRoute><AnunciosPage /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
    </>
  );
}
