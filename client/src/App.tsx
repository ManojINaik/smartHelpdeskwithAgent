

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/Home';
import TicketDetail from './pages/TicketDetail';
import KBList from './pages/KBList';
import KBEditor from './pages/KBEditor';
import AgentDashboard from './pages/AgentDashboard';
import SuggestionReview from './pages/SuggestionReview';
import NotificationCenter from './components/NotificationCenter';
import AdminConfig from './pages/AdminConfig';
import AdminUsers from './pages/AdminUsers';
import AdminMetrics from './pages/AdminMetrics';

// Removed unused Home component

function App() {
  return (
    <AuthProvider>
      <NotificationCenter />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
        <Route path="/kb" element={<ProtectedRoute roles={['admin','agent']}><KBList /></ProtectedRoute>} />
        <Route path="/kb/editor" element={<ProtectedRoute roles={['admin']}><KBEditor /></ProtectedRoute>} />
        <Route path="/agent" element={<ProtectedRoute roles={['admin','agent']}><AgentDashboard /></ProtectedRoute>} />
        <Route path="/agent/suggestion/:ticketId" element={<ProtectedRoute roles={['admin','agent']}><SuggestionReview /></ProtectedRoute>} />
        <Route path="/admin/config" element={<ProtectedRoute roles={['admin']}><AdminConfig /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/metrics" element={<ProtectedRoute roles={['admin']}><AdminMetrics /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;