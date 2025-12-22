// src/pages/Leads2.jsx (FINAL WITH PAGINATION, DATES, AND OWNER FIX)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, userService } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Filter, Mail, Phone, MapPin, DollarSign, X, Eye, Edit2, Upload, Download, MessageSquare, AlertCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// --- Import Modal Component (FR-10) ---
const ImportModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const importMutation = useMutation({
        mutationFn: async (file) => {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            // Simulating real FormData submission to the backend API endpoint
            return leadService.importLeads(formData); 
        },
        onSuccess: (data) => {
            alert(`Import successful: ${data.successfulImports} leads added, ${data.failedImports} skipped.`);
            queryClient.invalidateQueries(['leads']);
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Error processing file data. Ensure CSV/Excel columns are correct.';
            alert(`Import failed: ${message}`);
        },
        onSettled: () => {
            setUploading(false);
            setFile(null);
            onClose();
        }
    });

    const handleFileUpload = (e) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (file) {
            importMutation.mutate(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Leads (CSV/Excel)">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 p-6 text-center rounded-lg bg-slate-50">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer text-primary font-medium hover:text-blue-600">
                        <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                        {file ? `File Selected: ${file.name}` : "Click to select CSV file"}
                    </label>
                    <p className="text-sm text-slate-500 mt-2">Max size 5MB. Must contain 'name', 'email', 'company' columns.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button type="submit" disabled={!file || uploading} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20 disabled:opacity-50">
                        {uploading ? 'Uploading...' : 'Start Import'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const Leads = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); 
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalError, setModalError] = useState(''); 
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10); // Changed default to 10 for better pagination testing

  const initialFormState = { name: '', email: '', phone: '', company: '', status: 'new', source: 'website', budget: 0, assignedTo: '', city: '', description: '', customSourceDetail: '' };
  const [formData, setFormData] = useState(initialFormState);

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ status: '', source: '', assignedTo: '' });
  
  // Fetch users for ASSIGNMENT dropdown and filtering lookups (minimal fields)
  const { data: userData, isLoading: loadingUsers } = useQuery({ 
    queryKey: ['users'], 
    queryFn: () => userService.getUsers({ limit: 100 }).then(res => res.data),
    select: (response) => response.data || [] // CRITICAL: Extract array data
  });
  const users = userData || [];

  // Fetch Leads with Pagination/Filters
  const { data: leadsData, isLoading: loadingLeads, isFetching } = useQuery({
    queryKey: ['leads', { searchTerm, filters: activeFilters, currentPage, limit }],
    queryFn: () => leadService.getLeads({ 
        search: searchTerm, status: activeFilters.status, source: activeFilters.source, assignedTo: activeFilters.assignedTo, page: currentPage, limit: limit
    }),
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
  });
  const leads = leadsData?.data || [];
  const totalLeads = leadsData?.total || 0;
  const totalPages = Math.ceil(totalLeads / limit);


  const leadMutation = useMutation({
    mutationFn: (data) => editingId ? leadService.updateLead(editingId, data) : leadService.addLead(data),
    onSuccess: () => { queryClient.invalidateQueries(['leads']); setIsModalOpen(false); setModalError(''); },
    onError: (error) => { setModalError(error.response?.data?.message || 'Operation Failed: Check if email/phone already exists.'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (leadId) => leadService.deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      alert("Lead soft-deleted successfully.");
    },
    onError: (error) => {
      alert(`Deletion failed: ${error.response?.data?.message || 'Unauthorized or server error.'}`);
    }
  });

  const exportMutation = useMutation({
    mutationFn: (filters) => leadService.exportLeads(filters),
    onSuccess: (data) => {
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("Export successful.");
    },
    onError: (error) => {
        alert("Export failed: Server error or unauthorized.");
    },
  });

  const handleExport = () => { exportMutation.mutate({ search: searchTerm, ...activeFilters }); };

  const handleDeleteLead = (leadId, leadName) => {
    if (user.role !== 'admin' && user.role !== 'manager') {
        return alert("You must be an Admin or Manager to delete a lead.");
    }
    if (window.confirm(`Are you sure you want to soft-delete the lead: ${leadName}?`)) {
        deleteMutation.mutate(leadId);
    }
  };

  const handleOpenModal = (lead = null) => {
    setModalError(''); 
    if (lead) {
      setEditingId(lead.id);
      
      const assignedId = lead.assignedTo ? (lead.assignedTo._id || lead.assignedTo) : '';
      const customSourceDetail = lead.source === 'other' ? (lead.description || '').split('Custom Source: ')[1] || '' : '';


      setFormData({
        name: lead.name, email: lead.email, phone: lead.phone, company: lead.company, 
        status: lead.status, source: lead.source, budget: lead.budget || 0, 
        assignedTo: assignedId, 
        city: lead.city || '', 
        description: lead.description || '',
        customSourceDetail: customSourceDetail
      });
    } else {
      setEditingId(null);
      setFormData({...initialFormState, assignedTo: user?.id || ''});
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name || !formData.email || !formData.company || !formData.phone) {
        return setModalError('Please fill in all required fields (Name, Company, Email, Phone).');
    }
    
    let finalDescription = formData.description;
    if (formData.source === 'other' && formData.customSourceDetail) {
        finalDescription = `Custom Source: ${formData.customSourceDetail}. ${formData.description}`;
    }

    const payload = {
        ...formData,
        budget: Number(formData.budget),
        description: finalDescription,
        assignedTo: formData.assignedTo || user.id
    };
    delete payload.customSourceDetail; // Clean up temp field

    leadMutation.mutate(payload);
  };
  
  const clearFilters = () => {
    setActiveFilters({ status: '', source: '', assignedTo: '' });
    setSearchTerm('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'qualified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'converted': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentLeads = leads || [];
  const isLoading = loadingLeads || isFetching || loadingUsers || leadMutation.isPending || exportMutation.isPending || deleteMutation.isPending;

  const canDelete = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leads Management ({totalLeads})</h2>
          <p className="text-slate-500 mt-1">Capture, organize, and manage your potential customers.</p>
        </div>
        <div className="flex gap-3">
            <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 text-sm transition-colors"
                disabled={isLoading}
            >
                <Upload size={18} />
                Import
            </button>
            <button
                onClick={handleExport}
                className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 text-sm transition-colors"
                disabled={isLoading}
            >
                <Download size={18} />
                {exportMutation.isPending ? 'Exporting...' : 'Export'}
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 text-white bg-blue-900 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              disabled={isLoading}
            >
              <Plus size={18} />
              Add New Lead
            </button>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {(activeFilters.status || activeFilters.source || activeFilters.assignedTo) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-slate-700">Filter Leads</h3>
               <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                 <X size={12} /> Clear all
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                 <select 
                   className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                   value={activeFilters.status}
                   onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}
                 >
                   <option value="">All Statuses</option>
                   {['new', 'contacted', 'qualified', 'lost', 'converted'].map(s => (
                       <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Source</label>
                 <select 
                   className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                   value={activeFilters.source}
                   onChange={(e) => setActiveFilters({...activeFilters, source: e.target.value})}
                 >
                   <option value="">All Sources</option>
                   {['website', 'referral', 'call', 'other'].map(s => (
                       <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned User</label>
                 <select 
                   className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                   value={activeFilters.assignedTo}
                   onChange={(e) => setActiveFilters({...activeFilters, assignedTo: e.target.value})}
                 >
                   <option value="">All Users</option>
                   {users.map(u => (
                     <option key={u.id} value={u.id}>{u.name}</option>
                   ))}
                 </select>
               </div>
             </div>
          </div>
        )}
      </div>


      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading leads data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Info</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Owner (FR-9)</th> 
                  <th className="px-6 py-4">Dates</th> {/* Dates Column Header */}
                  <th className="px-6 py-4 text-right">Actions (FR-11)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLeads.map((lead) => {
                  const ownerName = lead.assignedTo ? lead.assignedTo.name : 'Unassigned';
                  const ownerInitial = lead.assignedTo ? lead.assignedTo.name.charAt(0) : 'U';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{lead.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{lead.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail size={14} className="text-slate-400" /> {lead.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone size={14} className="text-slate-400" /> {lead.phone}
                            </div>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                          <div className="text-xs text-slate-400 mt-1 pl-1 capitalize">Via {lead.source}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <DollarSign size={14} className="text-slate-400" />
                          {lead.budget?.toLocaleString()}
                        </div>
                        {lead.city && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <MapPin size={12} /> {lead.city}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
                                    {ownerInitial}
                                </div>
                                <span className="text-sm text-slate-600">{ownerName.split(' ')[0]}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      {/* Dates Column (NEW) */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                          <p>Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
                          <p>Updated: {new Date(lead.updatedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          
                          <button 
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors relative"
                            title="View Notes & Activities (FR-11)"
                            onClick={() => navigate(`/leads/${lead.id}#notes-section`)}
                          >
                            <MessageSquare size={16} />
                            {lead.notesCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {lead.notesCount}
                                </span>
                            )}
                          </button>

                          <button 
                            onClick={() => handleOpenModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Lead"
                            disabled={leadMutation.isPending}
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {canDelete && (
                            <button 
                              onClick={(e) => { e.preventDefault(); handleDeleteLead(lead.id, lead.name); }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Lead"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          
                          <Link 
                            to={`/leads/${lead.id}`} 
                            className="inline-flex items-center gap-1 text-primary hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={16} /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {currentLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                       {searchTerm || activeFilters.status || activeFilters.source || activeFilters.assignedTo ? (
                        <div className="flex flex-col items-center justify-center">
                          <Search size={48} className="text-slate-200 mb-4" />
                          <p className="text-lg font-medium text-slate-600">No leads match your criteria</p>
                          <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm font-medium">Clear filters</button>
                        </div>
                       ) : (
                           'No leads found. Add a new lead to get started.'
                       )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Lead" : "Create New Lead"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <input required type="tel" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
              <input type="number" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                {['new', 'contacted', 'qualified', 'lost', 'converted'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value, customSourceDetail: ''})}>
                {['website', 'referral', 'call', 'other'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              {/* Conditional Input for Custom Source */}
              {formData.source === 'other' && (
                  <input 
                      type="text"
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 mt-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter custom source name (e.g., Facebook Ad)"
                      value={formData.customSourceDetail || ''}
                      onChange={e => setFormData({...formData, customSourceDetail: e.target.value})}
                  />
              )}
            </div>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">(Self) {user?.name || 'Select User...'}</option> 
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
          </div>

          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" 
                rows="3"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Enter lead details, requirements, etc."
              ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={leadMutation.isPending} className="px-4 py-2  text-white bg-blue-900 hover:bg-blue-700 font-medium rounded-lg shadow-md shadow-blue-500/20">
              {leadMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* FR-10 Import Modal */}
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

    </div>
  );
};

export default Leads;