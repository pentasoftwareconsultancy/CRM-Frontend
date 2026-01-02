// src/pages/FollowUps.jsx (Final)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService, leadService, userService, notificationService } from '../services/api';
import { Calendar, CheckCircle, Phone, Mail, Users, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/authStore';

const FollowUps = () => {
  React.useEffect(() => {
    document.title = 'Follow Ups | NexusCRM';
  }, []);
  const { user } = useAuthStore();
  // Check for due follow-ups when admin/manager visits this page
  React.useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      notificationService.checkDueFollowUps().catch(err => {
        console.log('Failed to check due follow-ups:', err);
      });
    }
  }, [user]);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // pending|overdue|completed
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const initialFormState = { leadId: '', type: 'call', scheduledAt: '', note: '' };
  const [formData, setFormData] = useState(initialFormState);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // --- Fetch Data Hooks ---
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['allLeads'],
    queryFn: () => leadService.getLeads({ limit: 100 }).then(data => data.data),
    select: (data) => data
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({ limit: 100 }).then(res => res.data),
  });

  // Determine DB query status based on activeTab
  const statusQuery = activeTab;

  // Fetch Follow-Ups (PAGED)
  const { data: followUpsData, isLoading: loadingFollowUps, isFetching } = useQuery({
    queryKey: ['followups', statusQuery, currentPage, limit],
    queryFn: () => activityService.getFollowUps({
      status: statusQuery,
      page: currentPage,
      limit: limit
    }),
    keepPreviousData: true,
  });

  // --- Counting Logic (Fetches all relevant tasks for accurate count) ---
  const { data: allFollowUpsForCounts = [] } = useQuery({
    queryKey: ['allFollowUpsForCounts'],
    queryFn: () => activityService.getFollowUps({ status: 'pending|completed', limit: 1000 }).then(res => res.data),
    staleTime: 60000
  });

  const now = new Date();
  const counts = allFollowUpsForCounts.reduce((acc, f) => {
    if (f.status === 'completed') {
      acc.completed += 1;
    } else if (f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduledAt) < now)) {
      acc.overdue += 1;
    } else if (f.status === 'pending') {
      acc.pending += 1;
    }
    return acc;
  }, { pending: 0, overdue: 0, completed: 0 });


  // --- Filtering Logic ---
  const followUps = followUpsData?.data || [];
  const displayTotal = followUpsData?.total || 0;
  const totalPages = Math.ceil(displayTotal / limit);

  // --- Mutations ---
  const createFollowUpMutation = useMutation({
    mutationFn: (data) => activityService.createFollowUp(data.leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups']);
      queryClient.invalidateQueries(['allFollowUpsForCounts']); // Crucial for count update
      queryClient.invalidateQueries(['notifications_global_count']);
      setIsModalOpen(false);
      setFormData(initialFormState);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to schedule follow-up.');
    }
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: (id) => activityService.completeFollowUp(id, { result: 'Completed successfully.' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followups']);
      queryClient.invalidateQueries(['allFollowUpsForCounts']);
      queryClient.invalidateQueries(['notifications_global_count']);
    },
    onError: (err) => {
      alert(`Failed to complete activity: ${err.response?.data?.message || err.message}`);
    }
  });


  // --- Handlers ---
  const handleCreate = (e) => {
    e.preventDefault();
    setError('');

    // --- Validation Check ---
    if (!formData.leadId || !formData.scheduledAt) {
      return setError('Lead and Scheduled Date/Time are required fields.');
    }

    // Optional: Prevent scheduling too far in the past unless explicit logging is allowed
    // For simplicity, we stick to mandatory fields check only.
    // --- End Validation Check ---

    createFollowUpMutation.mutate(formData);
  };

  const handleComplete = (id) => {
    if (window.confirm('Mark this activity as complete?')) {
      completeFollowUpMutation.mutate(id);
    }
  };

  const getFollowUpTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone size={16} className="text-blue-500" />;
      case 'email': return <Mail size={16} className="text-purple-500" />;
      case 'meeting': return <Users size={16} className="text-emerald-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  const isLoading = loadingLeads || loadingFollowUps || isFetching || createFollowUpMutation.isLoading || completeFollowUpMutation.isLoading;

  return (
    // Responsive padding
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Follow Ups</h2>
          <p className="text-sm text-slate-500 mt-1">Stay on top of your customer interactions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2  bg-blue-900 hover:bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
          disabled={isLoading}
        >
          <Calendar size={18} />
          Schedule Activity
        </button>
      </div>

      {/* Tabs with Counts */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        {['pending', 'overdue', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }} // Reset page on tab change
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors flex-shrink-0 flex items-center gap-2 ${activeTab === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            {tab}
            {counts[tab] > 0 && (
              <span className={`text-[8px] w-4 h-4 rounded-full flex items-center justify-center transition-all ${tab === 'overdue'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : tab === 'completed'
                  ? 'bg-emerald-500 text-white font-bold shadow-sm'
                  : 'border border-dashed border-slate-400 text-slate-500 font-bold bg-white'
                }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading scheduled activities...</div>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>No {activeTab} activities found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followUps.map((item) => {
              // Find associated lead and user for display
              const associatedLead = leads.find(l => l.id === (item.lead?._id || item.lead));
              const assignedUser = users.find(u => u.id === (item.assignedTo?._id || item.assignedTo));

              return (
                // Responsive item layout
                <div key={item.id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 p-2 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0`}>
                      {getFollowUpTypeIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 flex flex-wrap items-center gap-2 capitalize">
                        {item.type} with {associatedLead?.name || item.lead?.name || 'Unknown Lead'}
                        {item.status === 'overdue' && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertCircle size={12} /> Overdue
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(item.scheduledAt).toLocaleString()}
                      </p>
                      {item.note && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 block sm:inline-block">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
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

      {/* Pagination Controls (Made responsive) */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 gap-3">
        <p className="text-sm text-slate-600">
          Showing {Math.min(displayTotal, (currentPage - 1) * limit + 1)} - {Math.min(displayTotal, currentPage * limit)} of {displayTotal} activities
        </p>
        <div className="flex items-center gap-4">
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
            className="rounded-lg border border-slate-300 text-sm py-1"
            disabled={isLoading}
          >
            {[10, 20, 50].map(l => <option key={l} value={l}>{l} per page</option>)}
          </select>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || isLoading || displayTotal === 0}
            className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>


      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Activity">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lead / Customer *</label>
            <select
              required
              className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={formData.leadId}
              onChange={e => setFormData({ ...formData, leadId: e.target.value })}
            >
              <option value="">Select a lead...</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                required
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                {['call', 'meeting', 'email', 'other'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
              <input
                required
                type="datetime-local"
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:focus:border-primary outline-none"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
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
              onChange={e => setFormData({ ...formData, note: e.target.value })}
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