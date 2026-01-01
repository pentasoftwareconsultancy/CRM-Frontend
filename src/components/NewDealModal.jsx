// src/components/NewDealModal.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService, leadService } from '../services/api';
import Modal from './Modal';
import { Calendar } from 'lucide-react';

const NewDealModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    leadId: '',
    title: '',
    value: '',
    currency: 'INR',
    expectedCloseDate: new Date().toISOString().substring(0, 10),
    description: '',
  });
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['convertibleLeads'],
    queryFn: () => leadService.getLeads({ status: 'new|contacted|qualified|converted' }).then(res => res.data),
  });

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead =>
    leadSearch === '' ||
    lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    lead.company?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    lead.email?.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const createDealMutation = useMutation({
    mutationFn: dealService.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['leads']);
      onClose();
      setFormData({ leadId: '', title: '', value: '', currency: 'INR', expectedCloseDate: new Date().toISOString().substring(0, 10), description: '' });
      setLeadSearch('');
      setSelectedLead(null);
      setShowLeadDropdown(false);
    },
    onError: (err) => {
      alert(`Deal creation failed: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleLeadSelect = (lead) => {
    setFormData({ ...formData, leadId: lead.id });
    setSelectedLead(lead);
    setLeadSearch(`${lead.name} - ${lead.company || lead.name}`);
    setShowLeadDropdown(false);
  };

  const handleLeadSearchChange = (e) => {
    const value = e.target.value;
    setLeadSearch(value);
    setFormData({ ...formData, leadId: '' });
    setSelectedLead(null);
    setShowLeadDropdown(true);
  };

  const handleLeadInputFocus = () => {
    setShowLeadDropdown(true);
  };

  const handleLeadInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowLeadDropdown(false), 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId) {
      alert('Please select a lead or customer.');
      return;
    }
    const value = Number(formData.value) || 0;
    if (value <= 0) {
      alert('Deal value must be greater than zero.');
      return;
    }
    createDealMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Lead/Customer *</label>
          <div className="relative">
            <input
              type="text"
              required
              className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none"
              value={leadSearch}
              onChange={handleLeadSearchChange}
              onFocus={handleLeadInputFocus}
              onBlur={handleLeadInputBlur}
              placeholder="Search by name, company, or email..."
              disabled={loadingLeads || createDealMutation.isPending}
            />
            {showLeadDropdown && filteredLeads.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredLeads.slice(0, 10).map(lead => (
                  <div
                    key={lead.id}
                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0"
                    onClick={() => handleLeadSelect(lead)}
                  >
                    <div className="font-medium text-slate-800">{lead.name}</div>
                    <div className="text-sm text-slate-600">
                      {lead.company && `${lead.company} • `}
                      {lead.email} •
                      <span className={`capitalize ${lead.status === 'converted' ? 'text-purple-600' : lead.status === 'qualified' ? 'text-green-600' : 'text-blue-600'}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showLeadDropdown && leadSearch && filteredLeads.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-3 text-center text-slate-500">
                No leads found matching "{leadSearch}"
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
          <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value *</label>
            <input required type="number" min="0" className="w-full rounded-lg border-slate-300 border px-3 py-2" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            className="w-full rounded-lg border-slate-300 border px-3 py-2 h-20 resize-none"
            placeholder="Add a brief description of the deal..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
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

export default NewDealModal;