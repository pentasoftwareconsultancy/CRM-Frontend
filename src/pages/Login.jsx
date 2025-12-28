// src/pages/Login.jsx (FINAL)
import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // --- Client-Side Validation ---
      // if (password.length < 6) { 
      //    setError('Password must be at least 6 characters long.');
      //    setIsLoading(false);
      //    return;
      // }

      await login(email, password);

      // Navigate to the Dashboard upon successful login
      navigate('/', { replace: true });

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Check credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">

      {/* LEFT SIDE: Visual Design & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[120px]"></div>
        </div>

        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">SmartCRM</h1>
          </div>

          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Accelerate your <br />
            <span className="text-blue-500">Sales Velocity.</span>
          </h2>

          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            The next generation of relationship management. Track leads, close deals, and analyze performance in one unified platform.
          </p>

          {/* Feature Highlights Card */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Real-time Pipeline</p>
                <p className="text-slate-500 text-xs">Dynamic drag-and-drop deal tracking.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Advanced Analytics</p>
                <p className="text-slate-500 text-xs">Deep insights into conversion rates and revenue.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Enterprise Security</p>
                <p className="text-slate-500 text-xs">Role-based access control and JWT authentication.</p>
              </div>
            </div>
          </div>

          <p className="mt-12 text-slate-500 text-sm font-medium">
            © 2025 NexusCRM Enterprise Solution. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md w-full">

          {/* Mobile Logo Only */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl mb-4">
              <LayoutDashboard size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">NexusCRM</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h3>
            <p className="text-slate-500">Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-800"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                {/* Forgot link intentionally commented out */}
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="remember" className="text-sm text-slate-600 font-medium">Keep me signed in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account? <span className="text-slate-900 font-bold">Contact your Administrator</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;