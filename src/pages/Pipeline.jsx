// src/pages/Pipeline.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, leadService, userService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Plus, GripVertical, Calendar, User as UserIcon, Building, AlertCircle, Circle, ExternalLink, Shield } from 'lucide-react';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'CANCELLED'];

// --- Color Configuration for Stages ---
const STAGE_STYLES = {
  NEW: {
    bg: 'bg-blue-50/50',
    headerBg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'bg-blue-500'
  },
  CONTACTED: {
    bg: 'bg-orange-50/50',
    headerBg: 'bg-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-700',
    accent: 'bg-orange-500'
  },
  QUALIFIED: {
    bg: 'bg-emerald-50/50',
    headerBg: 'bg-emerald-100',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500'
  },
  PROPOSAL_SENT: {
    bg: 'bg-purple-50/50',
    headerBg: 'bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
    accent: 'bg-purple-500'
  },
  NEGOTIATION: {
    bg: 'bg-indigo-50/50',
    headerBg: 'bg-indigo-100',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    accent: 'bg-indigo-500'
  },
  WON: {
    bg: 'bg-teal-50/50',
    headerBg: 'bg-teal-100',
    border: 'border-teal-200',
    text: 'text-teal-700',
    accent: 'bg-teal-500'
  },
  LOST: {
    bg: 'bg-slate-50/50',
    headerBg: 'bg-slate-200',
    border: 'border-slate-300',
    text: 'text-slate-600',
    accent: 'bg-slate-400'
  },
  CANCELLED: {
    bg: 'bg-rose-50/50',
    headerBg: 'bg-rose-100',
    border: 'border-rose-200',
    text: 'text-rose-700',
    accent: 'bg-rose-500'
  }
};

const NewDealModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    leadId: '',
    title: '',
    value: 0,
    currency: 'INR',
    expectedCloseDate: new Date().toISOString().substring(0, 10),
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['convertibleLeads'],
    queryFn: () => leadService.getLeads({ status: 'new|contacted|qualified' }).then(res => res.data),
  });

  const createDealMutation = useMutation({
    mutationFn: dealService.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['leads']);
      onClose();
      setFormData({ leadId: '', title: '', value: 0, currency: 'INR', expectedCloseDate: new Date().toISOString().substring(0, 10) });
    },
    onError: (err) => {
      alert(`Deal creation failed: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.value <= 0) {
      alert('Deal value must be greater than zero.');
      return;
    }
    createDealMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Lead *</label>
          <select
            required
            className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none"
            value={formData.leadId}
            onChange={e => setFormData({ ...formData, leadId: e.target.value })}
            disabled={loadingLeads || createDealMutation.isOnTime}
          >
            <option value="">{loadingLeads ? 'Loading Leads...' : 'Select a Lead...'}</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>{l.name} - {l.company} ({l.status})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
          <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value *</label>
            <input required type="number" min="0" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close Date</label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="date"
                className="w-full rounded-lg border-slate-300 border pl-10 pr-3 py-2"
                value={formData.expectedCloseDate}
                onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button type="submit" disabled={createDealMutation.isOnTime} className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
            {createDealMutation.isOnTime ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EditDealModal = ({ isOpen, onClose, deal }) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    value: 0,
    owner: '',
    currency: 'INR',
    stage: '',
    expectedCloseDate: '',
    closedReason: ''
  });

  React.useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        value: deal.value || 0,
        owner: deal.owner?._id || deal.owner || '',
        currency: deal.currency || 'INR',
        stage: deal.stage || '',
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().substring(0, 10) : '',
        closedReason: deal.closedReason || ''
      });
    }
  }, [deal]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers().then(res => res.data),
    enabled: isOpen
  });

  const updateDealMutation = useMutation({
    mutationFn: (updates) => dealService.updateDeal(deal.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      onClose();
    }
  });

  const closeDealMutation = useMutation({
    mutationFn: ({ status, reason }) => dealService.closeDeal(deal.id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['dashboardStats']);
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.value <= 0) {
      alert('Deal value must be greater than zero.');
      return;
    }

    // If the stage is terminal, use the closeDeal API
    if (['WON', 'LOST', 'CANCELLED'].includes(formData.stage) && formData.stage !== deal.stage) {
      if (!formData.closedReason || formData.closedReason.length < 3) {
        alert('Please provide a reason for closing the deal.');
        return;
      }
      closeDealMutation.mutate({ status: formData.stage, reason: formData.closedReason });
    } else {
      // Standard update for other fields or non-terminal stage changes
      updateDealMutation.mutate(formData);
    }
  };

  if (!deal) return null;

  const isTerminal = ['WON', 'LOST', 'CANCELLED'].includes(formData.stage);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Deal Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{deal.lead?.company || deal.lead?.name || 'Unknown Lead'}</span>
          </div>
          <Link
            to={`/leads/${deal.lead?.id || deal.lead?._id}`}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            View Lead <ExternalLink size={12} />
          </Link>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deal Title *</label>
          <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Value ({formData.currency}) *</label>
            <input required type="number" min="0" className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm" value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status / Stage</label>
            <select
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm capitalize"
              value={formData.stage}
              onChange={e => setFormData({ ...formData, stage: e.target.value })}
            >
              {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned To</label>
          <div className="relative flex items-center">
            <Shield size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <select
              className="w-full rounded-lg border-slate-300 border pl-10 pr-3 py-2 text-sm"
              value={formData.owner}
              onChange={e => setFormData({ ...formData, owner: e.target.value })}
            >
              <option value={currentUser?.id || currentUser?._id}>(Self) {currentUser?.name}</option>
              {users.filter(u => u.id !== currentUser?.id && u.id !== currentUser?._id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expected Close Date</label>
          <div className="relative flex items-center">
            <Calendar size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="date"
              className="w-full rounded-lg border-slate-300 border pl-10 pr-3 py-2 text-sm"
              value={formData.expectedCloseDate}
              onChange={e => setFormData({ ...formData, expectedCloseDate: e.target.value })}
            />
          </div>
        </div>

        {isTerminal && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for {formData.stage.replace('_', ' ')} *</label>
            <textarea
              required
              placeholder="Why was this deal closed?"
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm h-20 resize-none"
              value={formData.closedReason}
              onChange={e => setFormData({ ...formData, closedReason: e.target.value })}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg text-sm transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={updateDealMutation.isOnTime || closeDealMutation.isOnTime}
            className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md disabled:opacity-50"
          >
            {updateDealMutation.isOnTime || closeDealMutation.isOnTime ? 'Saving...' : 'Update Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Pipeline = () => {
  const queryClient = useQueryClient();
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'overdue', 'on_time'

  const handleEditDeal = (deal) => {
    setSelectedDeal(deal);
    setIsEditModalOpen(true);
  };

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: dealService.getDeals,
    select: (data) => data.filter(d => STAGES.includes(d.stage)),
    placeholderData: [],
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, stage }) => dealService.updateDealStage(dealId, stage),
    onMutate: async ({ dealId, stage }) => {
      await queryClient.cancelQueries(['deals']);
      const previousDeals = queryClient.getQueryData(['deals']);
      queryClient.setQueryData(['deals'], (old) => old.map(deal => deal.id === dealId ? { ...deal, stage: stage } : deal));
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['deals'], context.previousDeals);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['deals']);
      setDraggedDealId(null);
    },
  });

  const closeDealMutation = useMutation({
    mutationFn: ({ dealId, status, reason }) => dealService.closeDeal(dealId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
    onSettled: () => setDraggedDealId(null)
  });

  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    if (!draggedDealId) return;
    const deal = deals.find(d => d.id === draggedDealId);
    if (!deal || deal.stage === newStage) return;

    if (newStage === 'WON' || newStage === 'LOST' || newStage === 'CANCELLED') {
      const reason = prompt(`Enter reason for closing as ${newStage}:`);
      if (reason) closeDealMutation.mutate({ dealId: draggedDealId, status: newStage, reason });
    } else {
      updateStageMutation.mutate({ dealId: draggedDealId, stage: newStage });
    }
    setDraggedDealId(null);
  };

  const getStageTotal = (stage) => {
    return filteredDeals.filter(d => d.stage === stage).reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString();
  };

  // Filter deals based on active filter
  const getFilteredDeals = () => {
    const now = new Date();
    const closedStages = ['WON', 'LOST', 'CANCELLED'];
    
    return deals.filter(deal => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'overdue') {
        // Only show overdue deals that are NOT already closed
        return !closedStages.includes(deal.stage) && deal.expectedCloseDate && new Date(deal.expectedCloseDate) < now;
      }
      if (activeFilter === 'on_time') {
        // Only show on_time deals that are NOT already closed
        return !closedStages.includes(deal.stage) && (!deal.expectedCloseDate || new Date(deal.expectedCloseDate) >= now);
      }
      return true;
    });
  };

  const filteredDeals = getFilteredDeals();

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredDeals.filter(d => d.stage === stage);
    return acc;
  }, {});

  const isMutating = updateStageMutation.isOnTime || closeDealMutation.isOnTime;

  if (loadingDeals) return <div className="p-12 text-center text-slate-500">Loading pipeline...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 overflow-hidden bg-white">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Pipeline</h2>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            Move deals across stages to track progress.
          </p>
        </div>
        <button onClick={() => setIsNewDealModalOpen(true)} className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all">
          <Plus size={18} /> New Deal
        </button>
      </div>

      {/* Filter Labels */}
      <div className="flex gap-2 mb-4 px-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Deals ({deals.length})
        </button>
        <button
          onClick={() => setActiveFilter('on_time')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeFilter === 'on_time'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          On Time ({deals.filter(d => !['WON', 'LOST', 'CANCELLED'].includes(d.stage) && (!d.expectedCloseDate || new Date(d.expectedCloseDate) >= new Date())).length})
        </button>
        <button
          onClick={() => setActiveFilter('overdue')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeFilter === 'overdue'
              ? 'bg-red-700 text-white shadow-md'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          Overdue ({deals.filter(d => !['WON', 'LOST', 'CANCELLED'].includes(d.stage) && d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date()).length})
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 h-full kanban-scroll">
        {STAGES.map(stage => {
          const style = STAGE_STYLES[stage];
          return (
            <div
              key={stage}
              className={`min-w-[280px] flex flex-col h-full rounded-xl border ${style.bg} ${style.border} p-2 transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className={`flex justify-between items-center mb-4 px-3 py-2 rounded-lg ${style.headerBg} border ${style.border}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${style.accent}`} />
                  <span className={`font-bold ${style.text} text-xs uppercase tracking-widest`}>
                    {stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className={`bg-white/80 px-2 py-0.5 rounded-md text-[10px] font-bold ${style.text} border ${style.border}`}>
                  {dealsByStage[stage].length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 kanban-scroll">
                {dealsByStage[stage].map(deal => {
                  // We use the 'style' variable defined in the outer map (STAGES.map)
                  const style = STAGE_STYLES[stage];

                  return (
                    <div
                      key={deal.id}
                      onClick={() => handleEditDeal(deal)}
                      className={`bg-white p-4 rounded-xl shadow-sm border-2 ${style.border} hover:shadow-md transition-all group block relative overflow-hidden cursor-pointer ${draggedDealId === deal.id ? 'opacity-40' : ''
                        }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={() => setDraggedDealId(null)}
                    >
                      {/* 1. Side Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent}`} />

                      <div className="flex justify-between items-start mb-2">
                        {/* 2. Title now uses the Stage Color */}
                        <h4 className={`font-bold ${style.text} text-sm truncate group-hover:underline`}>
                          {deal.title}
                        </h4>
                        <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1.5 mb-3">
                        {deal.lead && (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                            <Building size={12} className="text-slate-400" />
                            <span className="truncate">{deal.lead.company || deal.lead.name}</span>
                          </div>
                        )}
                        {deal.owner && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={12} className="text-slate-400" />
                            <span>{deal.owner.name}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. The Amount/Price now uses the Stage Color and bolder font */}
                      <div className={`text-xl font-black ${style.text} tracking-tight`}>
                        ₹{deal.value.toLocaleString()}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                          <Calendar size={10} className={style.text} />
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            !['WON', 'LOST', 'CANCELLED'].includes(deal.stage) && deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date()
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-GB') : 'No date'}
                          </span>
                        </div>

                        {/* 4. Small stage indicator inside the card */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${style.headerBg} ${style.text}`}>
                          {stage.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`mt-3 py-2 text-center text-[11px] font-bold ${style.text} bg-white/50 rounded-lg border border-dashed ${style.border}`}>
                Total: {dealsByStage[stage][0]?.currency || '₹'}{getStageTotal(stage)}
              </div>
            </div>
          );
        })}
      </div>

      {isMutating && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce text-sm font-bold flex items-center gap-2 z-50">
          <Circle size={8} className="fill-blue-400 text-blue-400 animate-pulse" />
          Syncing Pipeline...
        </div>
      )}

      <NewDealModal isOpen={isNewDealModalOpen} onClose={() => setIsNewDealModalOpen(false)} />
      <EditDealModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
      />
    </div>
  );
};

export default Pipeline;