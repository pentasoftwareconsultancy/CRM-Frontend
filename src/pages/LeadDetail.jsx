import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, activityService, dealService, userService, customerService } from '../services/api';
import { ArrowLeft, Mail, Phone, MapPin, Building, MessageSquare, Briefcase, Edit, User as UserIcon, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuthStore } from '../store/authStore';

const LeadDetail = () => {
  const { user } = useAuthStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isCustomer = location.pathname.startsWith('/customers');

  // UI States
  const [newNote, setNewNote] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [modalError, setModalError] = useState('');

  // --- 1. Fetch Data Hooks ---
  const { data: lead, isLoading: loadingLead } = useQuery({
    queryKey: [isCustomer ? 'customer' : 'lead', id],
    queryFn: () => isCustomer ? customerService.getCustomer(id) : leadService.getLead(id),
    enabled: !!id,
  });

  // History ID (Lead ID) - for notes and deals
  const historyId = (isCustomer && lead?.lead) ? (lead.lead._id || lead.lead) : id;

  const { data: notes } = useQuery({
    queryKey: ['notes', historyId],
    queryFn: () => activityService.getLeadNotes(historyId),
    enabled: !!historyId,
    select: (data) => data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });

  const { data: deals } = useQuery({
    queryKey: ['deals', historyId],
    queryFn: () => dealService.getDeals({ leadId: historyId }),
    enabled: !!historyId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers({ role: 'sales|manager|admin', limit: 100 }),
    select: (response) => response.data || []
  });

  // --- 2. Mutations ---
  const addNoteMutation = useMutation({
    mutationFn: (content) => activityService.addNote(historyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes', historyId]);
      setNewNote('');
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: (updates) => isCustomer ? customerService.updateCustomer(id, updates) : leadService.updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries([isCustomer ? 'customer' : 'lead', id]);
      queryClient.invalidateQueries([isCustomer ? 'customers' : 'leads']);
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      alert(`Failed to update ${isCustomer ? 'customer' : 'lead'}: ${error.response?.data?.message || error.message}`);
    }
  });

  // --- 3. Scroll Logic (Handles #notes-section navigation) ---
  useEffect(() => {
    if (location.hash && !loadingLead) {
      setTimeout(() => {
        const el = document.getElementById(location.hash.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash, loadingLead]);


  // --- 4. Handlers ---
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  const handleEditClick = () => {
    if (!lead) return;

    const assignedId = lead.assignedTo ? (lead.assignedTo._id || lead.assignedTo) : '';

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
      description: lead.description || '',
      customSourceDetail: '' // Initialize the conditional field
    });

    setIsEditModalOpen(true);
  };

  const handleUpdateLead = (e) => {
    e.preventDefault();
    setModalError('');

    // Phone number validation (10 digits, no leading 0)
    const phoneDigits = editFormData.phone?.replace(/[\s-]/g, '') || '';
    if (!/^[1-9][0-9]{9}$/.test(phoneDigits)) {
      return setModalError('Please enter a valid 10-digit phone number (cannot start with 0).');
    }

    // Solution Logic: Append Custom Source to description if 'Other' is picked
    let finalDescription = editFormData.description;
    if (editFormData.source === 'other' && editFormData.customSourceDetail) {
      finalDescription = `[Source: ${editFormData.customSourceDetail}] ${editFormData.description}`;
    }

    const payload = {
      ...editFormData,
      budget: Number(editFormData.budget),
      description: finalDescription,
      assignedTo: editFormData.assignedTo || user?._id || user?.id
    };

    // Clean up temporary field before sending to API
    delete payload.customSourceDetail;
    // Enforce: Lead status must NOT be editable from the UI — strip it from update payloads
    if (payload.status) delete payload.status;

    updateLeadMutation.mutate(payload);
  };

  useEffect(() => {
    if (lead) {
      document.title = `${displayName} | ${isCustomer ? 'Customer' : 'Lead'} Details`;
    }
  }, [lead, displayName, isCustomer]);

  // --- 5. UI Helpers ---
  if (loadingLead) return <div className="p-12 text-center text-slate-500">Loading {isCustomer ? 'customer' : 'lead'} details...</div>;
  if (!lead) return <div className="p-12 text-center text-red-500">{isCustomer ? 'Customer' : 'Lead'} not found.</div>;

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

  const owner = lead.assignedTo || lead.owner;
  const leadOwnerName = owner?.name || 'Unassigned';

  // Normalize display fields
  const displayName = isCustomer ? lead.primaryContact : lead.name;
  const displayCompany = isCustomer ? lead.name : lead.company;
  const displayStatus = lead.status || (isCustomer ? 'WON' : 'new');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(isCustomer ? '/customers' : '/leads')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to {isCustomer ? 'Customers' : 'Leads'}
        </button>
        <button
          onClick={handleEditClick}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:text-primary hover:border-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Edit size={16} /> Edit {isCustomer ? 'Customer' : 'Lead'}
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          {isCustomer ? (
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg text-xs">Customer Profile</span>
          ) : (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs">Lead Profile</span>
          )}
        </h2>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {displayName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Building size={14} /> {displayCompany}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getStatusColor(displayStatus)}`}>
              {displayStatus}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-tighter">Added: {new Date(lead.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="p-2 bg-white rounded-lg shadow-xs"><Mail size={16} className="text-blue-500" /></div>
            {lead.email}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="p-2 bg-white rounded-lg shadow-xs"><Phone size={16} className="text-emerald-500" /></div>
            {lead.phone}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="p-2 bg-white rounded-lg shadow-xs"><MapPin size={16} className="text-amber-500" /></div>
            {lead.city || 'Location N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SECTION: Deals and Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Deals Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Active Deals
              </h3>
              <button onClick={() => navigate('/pipeline')} className="text-xs font-semibold text-primary hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">+ New Deal</button>
            </div>
            {deals?.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-4 border-2 border-dashed border-slate-50 text-center rounded-lg">No deals associated with this lead.</p>
            ) : (
              <div className="space-y-3">
                {deals?.map(deal => (
                  <div key={deal.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{deal.title}</p>
                      <p className="text-xs text-slate-500 uppercase font-medium">Stage: {deal.stage.replace('_', ' ')}</p>
                    </div>
                    <div className="font-bold text-slate-700 text-lg">
                      ₹{deal.value?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          <div id="notes-section" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <MessageSquare size={20} className="text-primary" /> Notes & Activity
            </h3>

            <form onSubmit={handleAddNote} className="mb-8">
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                rows="3"
                placeholder="Add a log or internal note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              ></textarea>
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={addNoteMutation.isPending} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {addNoteMutation.isPending ? 'Logging...' : 'Post Note'}
                </button>
              </div>
            </form>

            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {notes?.map((note) => (
                <div key={note.id} className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0 z-10">
                    {note.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-100">
                      <p className="text-slate-700 text-sm leading-relaxed">{note.content}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                      {new Date(note.createdAt).toLocaleString()} • BY {note.user?.name || 'SYSTEM'}
                    </p>
                  </div>
                </div>
              ))}
              {(notes?.length === 0 || !notes) && (
                <p className="text-center text-slate-400 text-sm py-4">No activity history yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Meta Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">Full Context</h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Acquisition Source</p>
                <p className="text-sm text-slate-700 capitalize font-medium">{lead.source}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Estimated Budget</p>
                <p className="text-sm text-slate-700 font-bold">₹{lead.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Relationship Manager</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {leadOwnerName.charAt(0)}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{leadOwnerName}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Initial Description</p>
                <p className="text-xs text-slate-600 italic leading-relaxed">{lead.description || 'No additional details provided.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT LEAD MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Update ${isCustomer ? 'Customer' : 'Lead'} Information`}>
        <form onSubmit={handleUpdateLead} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{modalError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.company} onChange={e => setEditFormData({ ...editFormData, company: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
              <input required type="tel" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
              {/* Make status read-only: show current status but do not allow edits */}
              <div className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm capitalize bg-slate-50">{editFormData.status}</div>
            </div>

            {/* SOLUTION: Conditional Source Logic */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
              <select
                className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none capitalize text-sm"
                value={editFormData.source}
                onChange={e => setEditFormData({ ...editFormData, source: e.target.value })}
              >
                {['website', 'referral', 'call', 'other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Conditional input appears only when 'Other' is selected */}
              {editFormData.source === 'other' && (
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 mt-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm animate-in fade-in slide-in-from-top-1"
                  placeholder="Where did they come from?"
                  value={editFormData.customSourceDetail || ''}
                  onChange={e => setEditFormData({ ...editFormData, customSourceDetail: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budget</label>
              <input type="number" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.budget} onChange={e => setEditFormData({ ...editFormData, budget: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
              <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.city} onChange={e => setEditFormData({ ...editFormData, city: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Owner</label>
            <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm" value={editFormData.assignedTo || ''} onChange={e => setEditFormData({ ...editFormData, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              <option value={user?.id || user?._id || ''}>(Self) {user?.name}</option>
              {users.filter(u => u.id !== (user?.id || user?._id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm"
              rows="3"
              value={editFormData.description}
              onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Needs, pain points, or general notes..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg text-sm transition-colors">Discard</button>
            <button type="submit" disabled={updateLeadMutation.isPending} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md">
              {updateLeadMutation.isPending ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadDetail;