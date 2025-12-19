import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService, leadService, userService } from '../services/api';
import { Calendar, CheckCircle, Phone, Mail, Users, FileText, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';

const FollowUps = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // Use 'pending' for upcoming/overdue
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const initialFormState = {
    leadId: '',
    type: 'call',
    scheduledAt: '',
    note: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Data Hooks ---
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => leadService.getLeads({ limit: 100 }).then(data => data.data),
    select: (data) => data.filter(l => l.status !== 'lost' && l.status !== 'converted')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({ status: 'active' }),
  });
  
  // Fetch Follow-Ups (5.3 GET /followups)
  const { data: followUps = [], isLoading: loadingFollowUps } = useQuery({
    queryKey: ['followups'],
    queryFn: () => activityService.getFollowUps({ status: 'pending|completed' }),
    select: (data) => {
        // Enhance data structure to handle overdue classification client-side
        const now = new Date();
        return data.map(f => {
            const isOverdue = f.status === 'pending' && new Date(f.scheduledAt) < now;
            return {
                ...f,
                status: isOverdue ? 'Overdue' : f.status,
                isOverdue: isOverdue
            };
        });
    }
  });

  // --- Mutations ---
  const createFollowUpMutation = useMutation({
    mutationFn: (data) => activityService.createFollowUp(data.leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups']);
      setIsModalOpen(false);
      setFormData(initialFormState);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to schedule follow-up.');
    }
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: (id) => activityService.completeFollowUp(id, { result: 'Completed successfully.' }), // Simplified completion data
    onSuccess: () => {
      queryClient.invalidateQueries(['followups']);
    },
    onError: (err) => {
      alert(`Failed to complete activity: ${err.response?.data?.message || err.message}`);
    }
  });


  // --- Handlers ---
  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.leadId || !formData.scheduledAt) {
        return setError('Lead and Scheduled Date/Time are required.');
    }
    createFollowUpMutation.mutate(formData);
  };

  const handleComplete = (id) => {
    if (window.confirm('Mark this activity as complete?')) {
        completeFollowUpMutation.mutate(id);
    }
  };

  // --- Filtering Logic ---
  const filteredData = followUps.filter(f => {
    if (activeTab === 'completed') return f.status === 'completed';
    
    // Non-completed logic
    if (f.status === 'completed') return false; 
    
    const isOverdue = f.status === 'Overdue';
    
    if (activeTab === 'overdue') return isOverdue;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDate = new Date(f.scheduledAt);

    if (activeTab === 'today') {
      return !isOverdue && scheduledDate >= today && scheduledDate < tomorrow;
    }
    if (activeTab === 'pending') { // Combines upcoming & today non-overdue
      return !isOverdue && scheduledDate >= today;
    }

    return true; // Should not happen
  });

  const getTabCount = (tab) => {
    if (tab === 'overdue') return followUps.filter(f => f.status === 'Overdue').length;
    if (tab === 'completed') return followUps.filter(f => f.status === 'completed').length;
    if (tab === 'pending') return followUps.filter(f => f.status === 'pending' && !f.isOverdue).length;
    return 0; // Simplified
  };
  
  const getFollowUpTypeIcon = (type) => {
    switch(type) {
      case 'call': return <Phone size={16} className="text-blue-500" />;
      case 'email': return <Mail size={16} className="text-purple-500" />;
      case 'meeting': return <Users size={16} className="text-emerald-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };
  
  const isLoading = loadingLeads || loadingFollowUps || createFollowUpMutation.isPending || completeFollowUpMutation.isPending;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Follow Ups</h2>
          <p className="text-slate-500 mt-1">Stay on top of your customer interactions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2  bg-blue-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          disabled={isLoading}
        >
          <Calendar size={18} />
          Schedule Activity
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {['pending', 'overdue', 'completed'].map(tab => (
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
            {(tab === 'overdue' || tab === 'completed') && getTabCount(tab) > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {getTabCount(tab)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading scheduled activities...</div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>No {activeTab} activities found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredData.map((item) => {
                // Find associated lead and user for display
                const associatedLead = leads.find(l => l.id === (item.lead?._id || item.lead));
                const assignedUser = users.find(u => u.id === (item.assignedTo?._id || item.assignedTo));

                return (
                  <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg bg-slate-100 border border-slate-200`}>
                        {getFollowUpTypeIcon(item.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2 capitalize">
                          {item.type} with {associatedLead?.name || item.lead?.name || 'Unknown Lead'}
                          {item.status === 'Overdue' && (
                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <AlertCircle size={12} /> Overdue
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(item.scheduledAt).toLocaleString()}
                        </p>
                        {item.note && (
                          <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                            "{item.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.status !== 'completed' && (
                        <button 
                          onClick={() => handleComplete(item.id)}
                          className="flex items-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all"
                          disabled={isLoading}
                        >
                          <CheckCircle size={16} />
                          Mark Complete
                        </button>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Assigned to</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] flex items-center justify-center font-bold">
                            {assignedUser?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm text-slate-700">{assignedUser?.name?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Activity">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
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
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                {['call', 'meeting', 'email', 'other'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
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
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={createFollowUpMutation.isPending} className="px-4 py-2 bg-blue-900 hover:bg-blue-600  text-white font-medium rounded-lg  shadow-md shadow-blue-500/20">
                {createFollowUpMutation.isPending ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FollowUps;