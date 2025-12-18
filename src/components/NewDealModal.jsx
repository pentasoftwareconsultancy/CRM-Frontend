// src/components/NewDealModal.jsx

import React, { useState } => 'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { leadService, dealService } from '../services/api';

const NewDealModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        leadId: '',
        title: '',
        value: 0,
        currency: 'INR',
        expectedCloseDate: new Date().toISOString().substring(0, 10),
    });
    
    // Fetch potential leads (Leads that are not LOST/CONVERTED)
    const { data: leads = [], isLoading: loadingLeads } = useQuery({
        queryKey: ['convertibleLeads'],
        queryFn: () => leadService.getLeads({ status: 'new|contacted|qualified' }).then(res => res.data),
    });
    
    const createDealMutation = useMutation({
        mutationFn: dealService.createDeal,
        onSuccess: () => {
            queryClient.invalidateQueries(['deals']);
            onClose();
            setFormData({
                leadId: '',
                title: '',
                value: 0,
                currency: 'INR',
                expectedCloseDate: new Date().toISOString().substring(0, 10),
            });
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
                        <input type="date" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.expectedCloseDate} onChange={e => setFormData({...formData, expectedCloseDate: e.target.value})} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" disabled={createDealMutation.isPending} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
                        {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default NewDealModal;