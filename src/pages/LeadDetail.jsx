
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { ArrowLeft, Mail, Phone, MapPin, Building, Calendar, Plus, MessageSquare, Briefcase, Edit } from 'lucide-react';
import Modal from '../components/Modal';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [users, setUsers] = useState([]);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchLeadData = async () => {
      setLoading(true);
      try {
        const [leadData, notesData, allDeals, usersData] = await Promise.all([
          api.getLead(id),
          api.getNotes(id),
          api.getDeals(),
          api.getUsers()
        ]);
        
        setLead(leadData);
        setNotes(notesData);
        setDeals(allDeals.filter(d => (d.leadId?._id || d.leadId) === id));
        setUsers(usersData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchLeadData();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const addedNote = await api.addNote({ leadId: id, content: newNote });
      setNotes([addedNote, ...notes]);
      setNewNote('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
      budget: lead.budget,
      assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
      city: lead.city || '',
      description: lead.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const updatedLead = await api.updateLead(id, {
         ...editFormData,
         budget: Number(editFormData.budget)
      });
      // We need to re-fetch or construct the full lead object with populated assignedTo if possible
      // For simplicity, we can fetch the specific lead again to get populated data
      const refreshedLead = await api.getLead(id);
      setLead(refreshedLead);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update lead');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading lead details...</div>;
  if (!lead) return <div className="p-12 text-center text-red-500">Lead not found.</div>;

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
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              lead.status === 'New' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              lead.status === 'Converted' ? 'bg-purple-100 text-purple-700 border-purple-200' :
              'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
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
        {/* Left Column: Info & Deals */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Deals Section */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Briefcase size={20} className="text-primary" /> Active Deals
               </h3>
               <button onClick={() => navigate('/pipeline')} className="text-xs font-medium text-primary hover:underline">+ New Deal</button>
             </div>
             {deals.length === 0 ? (
               <p className="text-slate-400 text-sm italic">No deals associated with this lead.</p>
             ) : (
               <div className="space-y-3">
                 {deals.map(deal => (
                   <div key={deal._id || deal.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center">
                     <div>
                       <p className="font-semibold text-slate-800">{deal.title}</p>
                       <p className="text-xs text-slate-500">Stage: {deal.stage}</p>
                     </div>
                     <div className="font-bold text-slate-700">
                        {deal.currency === 'INR' ? '₹' : '$'}{deal.value.toLocaleString()}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Notes Section */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
                 <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors">Add Note</button>
               </div>
             </form>

             <div className="space-y-6">
               {notes.map((note) => (
                 <div key={note._id || note.id} className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                     {note.createdBy?.name?.charAt(0) || 'U'}
                   </div>
                   <div>
                     <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                       <p className="text-slate-700 text-sm">{note.content}</p>
                     </div>
                     <p className="text-xs text-slate-400 mt-1 pl-1">
                       {new Date(note.createdAt).toLocaleString()} by {note.createdBy?.name || 'You'}
                     </p>
                   </div>
                 </div>
               ))}
               {notes.length === 0 && (
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
                <p className="text-slate-700">{lead.source}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Budget</p>
                <p className="text-slate-700">${lead.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Assigned To</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
                    {lead.assignedTo?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm text-slate-700">{lead.assignedTo?.name || 'Unassigned'}</span>
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

      {/* Edit Modal */}
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
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.source} onChange={e => setEditFormData({...editFormData, source: e.target.value})}>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={editFormData.assignedTo} onChange={e => setEditFormData({...editFormData, assignedTo: e.target.value})}>
                <option value="">Select User...</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>why
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
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeadDetail;
