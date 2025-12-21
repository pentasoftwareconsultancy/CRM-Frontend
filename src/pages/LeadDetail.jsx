import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'; // added useEffect, useLocation, RouterLink
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, activityService, dealService, userService } from '../services/api';
import { ArrowLeft, Mail, Phone, MapPin, Building, Plus, MessageSquare, Briefcase, Edit, User as UserIcon } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/authStore';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // --- Fetch Data Hooks ---
  const { data: lead, isLoading: loadingLead } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id),
    enabled: !!id,
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['leadNotes', id],
    queryFn: () => activityService.getLeadNotes(id),
    enabled: !!id,
    select: (data) => data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });

  const { data: deals, isLoading: loadingDeals } = useQuery({
    queryKey: ['leadDeals', id],
    queryFn: () => dealService.getDeals({ leadId: id }),
    enabled: !!id,
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({ role: 'sales|manager|admin' }),
  });
  
  // --- Mutations ---
  const addNoteMutation = useMutation({
    mutationFn: (content) => activityService.addNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['leadNotes', id]);
      setNewNote('');
    },
    onError: (error) => {
      alert(`Failed to add note: ${error.response?.data?.message || error.message}`);
    }
  });
  
  const updateLeadMutation = useMutation({
    mutationFn: (updates) => leadService.updateLead(id, updates),
    onSuccess: () => {
      // Re-fetch the lead data to update the UI with fresh, populated data
      queryClient.invalidateQueries(['lead', id]); 
      queryClient.invalidateQueries(['leads']);
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      alert(`Failed to update lead: ${error.response?.data?.message || error.message}`);
    }
  });

  // --- FIX: Implement Scroll Logic on Hash Change ---
  const location = useLocation(); // new
  useEffect(() => {
    if (location.hash) {
      // ensure DOM is ready before attempting to scroll
      requestAnimationFrame(() => {
        const el = document.getElementById(location.hash.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [location.hash, loadingLead, loadingNotes]);


  // --- Handlers ---
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  const handleEditClick = () => {
    if (!lead) return; 

    // FIX: Explicitly populate formData using the resolved 'lead' object
    const assignedId = lead.assignedTo 
        ? (lead.assignedTo._id || lead.assignedTo) 
        : '';
        
    setEditFormData({
        name: lead.name || '', 
        email: lead.email || '', 
        phone: lead.phone || '', 
        company: lead.company || '', 
        status: lead.status || 'new', 
        source: lead.source || 'other', 
        budget: lead.budget || 0, 
        assignedTo: assignedId, 
        city: lead.city || '', 
        description: lead.description || ''
    });

    setIsEditModalOpen(true);
  };

  const handleUpdateLead = (e) => {
    e.preventDefault();
    const updates = { 
        ...editFormData, 
        budget: Number(editFormData.budget),
        assignedTo: editFormData.assignedTo || null 
    };
    updateLeadMutation.mutate(updates);
  };

  if (loadingLead || loadingNotes || loadingDeals) return <div className="p-12 text-center text-slate-500">Loading lead details...</div>;
  if (!lead) return <div className="p-12 text-center text-red-500">Lead not found.</div>;

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

  const leadOwner = users.find(u => u.id === (lead.assignedTo?._id || lead.assignedTo));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/leads')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to Leads
        </button>
        <button 
          onClick={handleEditClick}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:text-primary hover:border-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          disabled={updateLeadMutation.isPending}
        >
          <Edit size={16} /> Edit Lead
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {lead.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{lead.name}</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Building size={14} />
                {lead.company}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getStatusColor(lead.status)}`}>
              {lead.status}
            </span>
            <span className="text-xs text-slate-400">Added on {new Date(lead.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="flex items-center gap-3 text-sm text-slate-600">
             <div className="p-2 bg-white rounded-lg shadow-sm"><Mail size={16} className="text-blue-500" /></div>
             {lead.email}
           </div>
           <div className="flex items-center gap-3 text-sm text-slate-600">
             <div className="p-2 bg-white rounded-lg shadow-sm"><Phone size={16} className="text-emerald-500" /></div>
             {lead.phone}
           </div>
           <div className="flex items-center gap-3 text-sm text-slate-600">
             <div className="p-2 bg-white rounded-lg shadow-sm"><MapPin size={16} className="text-amber-500" /></div>
             {lead.city || 'No Location'}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Deals & Notes */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Deals Section */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Briefcase size={20} className="text-primary" /> Active Deals
               </h3>
               <button onClick={() => navigate('/pipeline')} className="text-xs font-medium text-primary hover:underline">+ New Deal</button> 
             </div>
             {deals?.length === 0 ? (
               <p className="text-slate-400 text-sm italic">No deals associated with this lead.</p>
             ) : (
               <div className="space-y-3">
                 {deals?.map(deal => (
                   <div key={deal.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center">
                     <div>
                       <p className="font-semibold text-slate-800">{deal.title}</p>
                       <p className="text-xs text-slate-500">Stage: {deal.stage}</p>
                     </div>
                     <div className="font-bold text-slate-700">
                        {deal.currency || '₹'}{deal.value?.toLocaleString()}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Notes Section: ADD ID HERE */}
           <div id="notes-section" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
               <MessageSquare size={20} className="text-primary" /> Notes & Activity
             </h3>
             
             <form onSubmit={handleAddNote} className="mb-6">
               <textarea 
                 className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                 rows="3"
                 placeholder="Add a note about this lead..."
                 value={newNote}
                 onChange={(e) => setNewNote(e.target.value)}
               ></textarea>
               <div className="flex justify-end mt-2">
                 <button type="submit" disabled={addNoteMutation.isPending} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors">
                     {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                 </button>
               </div>
             </form>

             <div className="space-y-6">
               {notes?.map((note) => (
                 <div key={note.id} className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                     {note.user?.name?.charAt(0) || 'U'}
                   </div>
                   <div>
                     <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                       <p className="text-slate-700 text-sm">{note.content}</p>
                     </div>
                     <p className="text-xs text-slate-400 mt-1 pl-1">
                       {new Date(note.createdAt).toLocaleString()} by {note.user?.name || 'Unknown'}
                     </p>
                   </div>
                 </div>
               ))}
               {(notes?.length === 0 || !notes) && (
                 <p className="text-center text-slate-400 text-sm py-4">No notes yet.</p>
               )}
             </div>
           </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Lead Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Source</p>
                <p className="text-slate-700 capitalize">{lead.source}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Budget</p>
                <p className="text-slate-700">${lead.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Assigned To</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
                    {leadOwner?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm text-slate-700">{leadOwner?.name || 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Description</p>
                <p className="text-sm text-slate-600 mt-1">{lead.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Form uses local editFormData state) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Lead">
        <form onSubmit={handleUpdateLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.company} onChange={e => setEditFormData({...editFormData, company: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input required type="tel" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
              <input type="number" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.budget} onChange={e => setEditFormData({...editFormData, budget: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.city} onChange={e => setEditFormData({...editFormData, city: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                {['new', 'contacted', 'qualified', 'lost', 'converted'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize" value={editFormData.source} onChange={e => setEditFormData({...editFormData, source: e.target.value})}>
                {['website', 'referral', 'call', 'other'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.assignedTo} onChange={e => setEditFormData({...editFormData, assignedTo: e.target.value})}>
                <option value="">Select User...</option>
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
                value={editFormData.description} 
                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Enter lead details, requirements, etc."
              ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={updateLeadMutation.isPending} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
                {updateLeadMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadDetail;