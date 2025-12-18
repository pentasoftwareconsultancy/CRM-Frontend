// src/pages/Login.jsx (UPDATED)

import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore'; // Import Zustand store

const Login = () => {
  const { login } = useAuthStore(); // Get login action from store
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password); // Use Zustand login action
    } catch (err) {
      // API error handling
      const errorMessage = err.response?.data?.message || 'Login failed. Check credentials and server status.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* ... (rest of the Login component UI remains the same) ... */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-xl mb-4 text-primary">
            <LayoutDashboard size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to NexusCRM</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your leads & pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;