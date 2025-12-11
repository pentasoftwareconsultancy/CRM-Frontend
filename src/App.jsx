import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Leads from './pages/Leads'
import Pipeline from './pages/Pipeline'
import AdminUsers from './pages/AdminUsers'
import { api } from './services/mockApi';
import FollowUps from './pages/FollowUps';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading NexusCRM...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
              <Route path="/pipeline" element={<Pipeline/>} />
              <Route path="/admin/users" element={<AdminUsers/>} />
              <Route path="/followups" element={<FollowUps/>} />
              <Route path="*" element={<Navigate to="/" replace />} />
              
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;