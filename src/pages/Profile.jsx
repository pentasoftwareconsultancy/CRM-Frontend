
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { User, Shield, Mail, Key, Briefcase, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const Profile = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ 
        ...prev, 
        name: currentUser.name || '', 
        email: currentUser.email || '' 
      }));
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);
    
    try {
      await api.updateProfile({
        name: formData.name,
        password: formData.newPassword // Backend handles hashing
      });
      
      setStatus({ type: 'success', message: 'Profile updated successfully' });
      setFormData(prev => ({ ...prev, newPassword: '', currentPassword: '' }));
      
      // Ideally trigger a user reload in App.jsx here, or update local storage
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="text-slate-500">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID Card & Stats */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-slate-100 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner group relative">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
            <p className="text-slate-500 mb-4">{currentUser.email}</p>
            
            <div className="w-full flex justify-center gap-2 mb-4">
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                 currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                 currentUser.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                 'bg-emerald-100 text-emerald-700 border-emerald-200'
               }`}>
                 {currentUser.role}
               </span>
            </div>
          </div>

          {/* Role Specific Stats Card */}
          {currentUser.role === 'sales' && (
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h4 className="font-semibold flex items-center gap-2 mb-4 opacity-90">
                <TrendingUp size={18} /> Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <p className="text-xs opacity-70 mb-1">Deals Won</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <p className="text-xs opacity-70 mb-1">Conversion</p>
                  <p className="text-2xl font-bold">24%</p>
                </div>
              </div>
            </div>
          )}

          {currentUser.role === 'admin' && (
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
               <h4 className="font-semibold flex items-center gap-2 mb-2 opacity-90">
                 <Shield size={18} /> Admin Access
               </h4>
               <p className="text-sm text-slate-300">You have full control over users, settings, and system configurations.</p>
             </div>
          )}
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
            <User size={20} className="text-primary" />
            Personal Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Email cannot be changed directly.</p>
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                <Key size={20} className="text-primary" />
                Security
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                   <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      placeholder="Min 6 characters"
                      value={formData.newPassword}
                      onChange={e => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1 ml-1">Leave blank to keep current password.</p>
                </div>
              </div>
            </div>

            {status.message && (
              <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                {status.message}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
