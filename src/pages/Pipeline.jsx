// src/pages/Pipeline.jsx (Final & Robust Version - Including owner and lead data)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, leadService } from '../services/api';
import { Plus, GripVertical, Calendar, User as UserIcon, Building, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom'; 

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];

// --- New Deal Modal Component (included for context) ---
const NewDealModal = ({ isOpen, onClose }) => {
    // ... (modal logic remains the same) ...
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
        createDealMutation.mutate(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Deal (4.2)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Lead *</label>
                    <select 
                        required
                        className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none"
                        value={formData.leadId} 
                        onChange={e => setFormData({...formData, leadId: e.target.value})}
                        disabled={loadingLeads || createDealMutation.isPending}
                    >
                        <option value="">{loadingLeads ? 'Loading Leads...' : 'Select a Lead...'}</option>
                        {leads.map(l => (
                            <option key={l.id} value={l.id}>{l.name} - {l.company} ({l.status})</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
                    <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Value *</label>
                        <input required type="number" min="0" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close Date</label>
                        <div className="relative flex items-center">
                            <Calendar size={18} className="absolute left-3 text-slate-400 pointer-events-none" />
                            <input 
                                type="date" 
                                className="w-full rounded-lg border-slate-300 border pl-10 pr-3 py-2" 
                                value={formData.expectedCloseDate} 
                                onChange={e => setFormData({...formData, expectedCloseDate: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" disabled={createDealMutation.isPending} className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
                        {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Pipeline Component ---

const Pipeline = () => {
  const queryClient = useQueryClient();
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  // --- Fetch Deals Hook ---
  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: dealService.getDeals,
    select: (data) => data.filter(d => STAGES.includes(d.stage)),
    placeholderData: [],
  });

  // --- Mutations (Stage Update and Close Deal) remain the same ---
  
  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, stage }) => dealService.updateDealStage(dealId, stage),
    onMutate: async ({ dealId, stage }) => {
      await queryClient.cancelQueries(['deals']);
      const previousDeals = queryClient.getQueryData(['deals']);
      
      queryClient.setQueryData(['deals'], (old) => {
        return old.map(deal => 
          deal.id === dealId ? { ...deal, stage: stage } : deal
        );
      });
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['deals'], context.previousDeals);
      alert(`Failed to update stage: ${err.response?.data?.message || err.message}`);
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
        queryClient.invalidateQueries(['dashboardStats']); // Update reports
    },
    onError: (err) => {
        alert(`Failed to close deal: ${err.response?.data?.message || err.message}`);
    },
    onSettled: () => {
        setDraggedDealId(null);
    }
  });


  // --- Drag & Drop Handlers ---

  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    if (!draggedDealId) return;
    
    const dealId = draggedDealId;
    const deal = deals.find(d => d.id === dealId);
    
    if (!deal) return;

    if (deal.stage !== newStage) {
      // 1. Check for Closing Stages (WON/LOST)
      if (newStage === 'WON' || newStage === 'LOST') {
        const reason = prompt(`Enter reason for closing this deal as ${newStage}:`);
        
        if (reason) {
            closeDealMutation.mutate({ dealId, status: newStage, reason });
        } else {
            setDraggedDealId(null); 
            return;
        }

      } else {
        // 2. Trigger Standard Stage Movement (Non-Closing)
        updateStageMutation.mutate({ dealId, stage: newStage });
      }
    }
    
    setDraggedDealId(null); 
  };

  // --- UI Helpers ---

  const getStageTotal = (stage) => {
    return deals
      .filter(d => d.stage === stage)
      .reduce((acc, curr) => acc + (curr.value || 0), 0)
      .toLocaleString();
  };

  // Group deals by stage for display
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage);
    return acc;
  }, {});

  const isMutating = updateStageMutation.isPending || closeDealMutation.isPending;

  if (loadingDeals) return <div className="p-12 text-center text-slate-500">Loading pipeline...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden bg-slate-100">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales Pipeline</h2>
          <p className="text-slate-500 text-sm">Drag and drop deals to move them through the funnel (FR-14).</p>
        </div>
        
        {/* New Deal Button */}
        <button 
          onClick={() => setIsNewDealModalOpen(true)}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus size={18} />
          New Deal
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full kanban-scroll">
        {STAGES.map(stage => (
          <div 
            key={stage} 
            className="min-w-[300px] flex flex-col h-full bg-slate-200/50 rounded-xl border border-slate-200/60 p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{stage.replace(/_/g, ' ')}</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200">
                {dealsByStage[stage].length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 kanban-scroll">
              {dealsByStage[stage].map(deal => {
                
                // --- ROBUST NULL CHECK AND LINK SETUP ---
                const isLeadValid = !!deal.lead;
                const leadIdForLink = isLeadValid ? (deal.lead.id || deal.lead._id) : null;
                const linkTo = isLeadValid ? `/leads/${leadIdForLink}` : '#';

                return (
                  <Link 
                    key={deal.id}
                    to={linkTo}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all group block ${
                      draggedDealId === deal.id ? 'opacity-50 border-dashed border-primary-500' : ''
                    } ${isMutating ? 'pointer-events-none' : 'cursor-pointer'}`}
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, deal.id);
                    }}
                    onDragEnd={() => setDraggedDealId(null)}
                    onClick={(e) => {
                        if (!isLeadValid) {
                           e.preventDefault();
                           alert("Cannot view details: Associated lead data is missing or corrupted. Please check deal ID.");
                        }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{deal.title}</h4>
                      <GripVertical size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                    </div>
                    
                    {/* Lead and Owner Information */}
                    <div className="text-xs text-slate-500 space-y-1 mb-2">
                      {/* Show Lead/Company Name */}
                      {deal.lead ? (
                          <div className="flex items-center gap-1.5">
                              <Building size={12} />
                              <span className="font-medium text-slate-700 truncate">{deal.lead.company || deal.lead.name}</span>
                          </div>
                      ) : (
                          <div className="flex items-center gap-1.5 text-red-500 italic">
                              <AlertCircle size={12} /> Missing Lead Data
                          </div>
                      )}
                      
                      {/* Show Deal Owner (deal.owner is populated in backend) */}
                      {deal.owner && (
                          <div className="flex items-center gap-1.5">
                              <UserIcon size={12} />
                              <span>Owner: {deal.owner.name.split(' ')[0]}</span>
                          </div>
                      )}
                    </div>

                    <div className="text-xl font-bold text-slate-700 mb-3">
                      {deal.currency || '₹'}{deal.value.toLocaleString()}
                    </div>
                    
                    <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
                      <span>Expected Close:</span>
                      <span className="font-medium text-slate-600">
                        {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mutation Status Indicator */}
            {isMutating && (
                <div className="mt-3 text-center text-xs text-blue-500 font-semibold">
                    Updating pipeline...
                </div>
            )}

            <div className="mt-3 text-center text-xs font-semibold text-slate-500 border-t border-slate-300/20 pt-2">
               Total: {dealsByStage[stage][0]?.currency || '₹'}{getStageTotal(stage)}
            </div>
          </div>
        ))}
      </div>
      
      {/* NEW DEAL MODAL */}
      <NewDealModal isOpen={isNewDealModalOpen} onClose={() => setIsNewDealModalOpen(false)} />
    </div>
  );
};

export default Pipeline;