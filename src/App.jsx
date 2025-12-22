// src/App.jsx (UPDATED)

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore'; // Import Zustand Store
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
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'; // Import QueryClient for context
import Customers from './pages/Customers'; // Import the new component


// Helper for Protected Routes
const ProtectedRoute = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true); // State to handle initial Zustand hydration

  // Simulate initial check/hydration (Zustand handles it now via localStorage)
  useEffect(() => {
    // In a real app, you'd verify the token is still valid on the server here.
    // Since Zustand loads the user instantly from localStorage, set loading to false quickly.
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    logout();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading NexusCRM...</div>;

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen font-sans">
        <Sidebar onLogout={handleLogout} userRole={user.role} />
        <div className="flex-1 ml-64 flex flex-col">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto bg-slate-50/50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/followups" element={<FollowUps />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/profile" element={<Profile currentUser={user} />} />

              {/* Admin Routes */}
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
    </Router>
  );
};

export default App;