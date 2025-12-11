import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Calendar, CheckCircle, Clock, Phone, Mail, Users, FileText, AlertCircle, Search } from 'lucide-react';
import Modal from '../components/Modal';

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // today, upcoming, overdue, completed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  
  // Create Form State
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'Call',
    scheduledAt: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [data, leadsData] = await Promise.all([
      api.getFollowUps(),
      api.getLeads()
    ]);
    setFollowUps(data);
    setLeads(leadsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.addFollowUp(formData);
    setIsModalOpen(false);
    fetchData();
    setFormData({ leadId: '', type: 'Call', scheduledAt: '', notes: '' });
  };

  const handleComplete = async (id) => {
    await api.completeFollowUp(id);
    // Optimistic update
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'Completed' } : f));
  };

  const filterFollowUps = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return followUps.filter(f => {
      const date = new Date(f.scheduledAt);
      if (activeTab === 'completed') return f.status === 'Completed';
      if (f.status === 'Completed') return false; // Hide completed from other tabs

      if (activeTab === 'overdue') return f.status === 'Overdue' || (date < today && f.status !== 'Completed');
      if (activeTab === 'today') {
        return date >= today && date < tomorrow;
      }
      if (activeTab === 'upcoming') {
        return date >= tomorrow;
      }
      return true;
    });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Call': return <Phone size={16} className="text-blue-500" />;
      case 'Email': return <Mail size={16} className="text-purple-500" />;
      case 'Meeting': return <Users size={16} className="text-emerald-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  const filteredData = filterFollowUps();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Follow Ups</h2>
          <p className="text-slate-500 mt-1">Stay on top of your customer interactions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          <Calendar size={18} />
          Schedule Activity
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {['today', 'upcoming', 'overdue', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
            {tab === 'overdue' && followUps.filter(f => f.status === 'Overdue').length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                {followUps.filter(f => f.status === 'Overdue').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading scheduled activities...</div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>No {activeTab} activities found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredData.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg bg-slate-100 border border-slate-200`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      {item.type} with {item.leadName || item.leadId.name || 'Unknown Lead'}
                      {item.status === 'Overdue' && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertCircle size={12} /> Overdue
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(item.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status !== 'Completed' && (
                    <button 
                      onClick={() => handleComplete(item.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all"
                    >
                      <CheckCircle size={16} />
                      Mark Complete
                    </button>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Assigned to</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] flex items-center justify-center font-bold">
                        A
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Activity">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lead / Customer</label>
            <select 
              required
              className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={formData.leadId} 
              onChange={e => setFormData({...formData, leadId: e.target.value})}
            >
              <option value="">Select a lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Call">Phone Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">General Task</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={formData.scheduledAt}
                onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea 
              rows="3"
              className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="What is the agenda?"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FollowUps;