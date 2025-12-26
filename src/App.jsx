// src/App.jsx (Finalized Logout Navigation)
import React, { useEffect, useState } from 'react';
// Import Router outside, use Routes/Route/Navigate inside a component descendant of Router.
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'; 
import { useAuthStore } from './store/authStore';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import FollowUps from './pages/FollowUps';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Customers from './pages/Customers';

const ProtectedRoute = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Internal Component that uses useNavigate
const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navigate = useNavigate(); // Hook available because AppLayout is inside Router

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    // Explicitly navigate to root after clearing state
    navigate('/', { replace: true }); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading NexusCRM...</div>;

  if (!user) return <Login />;

  const contentMarginClass = isCollapsed ? 'lg:ml-20' : 'lg:ml-64';

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        onLogout={handleLogout} 
        userRole={user.role} 
        isMobileOpen={isSidebarOpen} 
        setIsMobileOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${contentMarginClass} ml-0`}>
        <TopBar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-slate-50/50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/profile" element={<Profile currentUser={user} />} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute user={user} allowedRoles={['admin', 'manager']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};


// The exported App component that wraps the layout in the Router
const App = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;