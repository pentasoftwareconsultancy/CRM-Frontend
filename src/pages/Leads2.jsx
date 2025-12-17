
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import Modal from '../components/Modal';
import { Plus, Search, Filter, Mail, Phone, MapPin, DollarSign, X, Eye, User, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    source: '',
    assignedTo: ''
  });
  
  // Form State
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New',
    source: 'Website',
    budget: '',
    assignedTo: '',
    city: '',
    description: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, usersData] = await Promise.all([
        api.getLeads(),
        api.getUsers()
      ]);
      setLeads(leadsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setEditingId(lead._id || lead.id);
      setFormData({
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
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget),
        assignedTo: formData.assignedTo || (users.length > 0 ? users[0]._id : null)
      };

      if (editingId) {
        await api.updateLead(editingId, payload);
      } else {
        await api.addLead(payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save lead');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Qualified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'Converted': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filter Logic
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeFilters.status ? l.status === activeFilters.status : true;
    const matchesSource = activeFilters.source ? l.source === activeFilters.source : true;
    const matchesOwner = activeFilters.assignedTo ? (
      (l.assignedTo?._id === activeFilters.assignedTo) || 
      (l.assignedTo === activeFilters.assignedTo)
    ) : true;

    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });

  const clearFilters = () => {
    setActiveFilters({ status: '', source: '', assignedTo: '' });
    setSearchTerm('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leads Management</h2>
          <p className="text-slate-500 mt-1">Capture, organize, and manage your potential customers.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Add New Lead
        </button>
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 f  ocus:border-primary text-sm"
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

        {/* Expandable Filter Panel */}
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
                   <option value="New">New</option>
                   <option value="Contacted">Contacted</option>
                   <option value="Qualified">Qualified</option>
                   <option value="Lost">Lost</option>
                   <option value="Converted">Converted</option>
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
                   <option value="Website">Website</option>
                   <option value="Referral">Referral</option>
                   <option value="LinkedIn">LinkedIn</option>
                   <option value="Cold Call">Cold Call</option>
                   <option value="Other">Other</option>
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
                     <option key={u._id} value={u._id}>{u.name}</option>
                   ))}
                 </select>
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
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
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const leadId = lead._id || lead.id;
                  const hasOwnerName = lead.assignedTo && lead.assignedTo.name;

                  return (
                    <tr key={leadId} className="hover:bg-slate-50 transition-colors">
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
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        <div className="text-xs text-slate-400 mt-1 pl-1">Via {lead.source}</div>
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
                      <div className="flex items-center gap-2">
                        <img 
                          className="w-6 h-6 rounded-full border border-slate-200" 
                          src={`https://ui-avatars.com/api/?name=${users.find(u => u.id === lead.assignedTo)?.name || 'U'}&background=random`} 
                          alt="Owner" 
                        />
                        <span className="text-sm text-slate-600">
                          {users.find(u => u.id === lead.assignedTo)?.name.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 size={16} />
                          </button>
                          {leadId ? (
                            <Link 
                              to={`/leads/${leadId}`} 
                              className="inline-flex items-center gap-1 text-primary hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Eye size={16} /> View
                            </Link>
                          ) : (
                            <span className="text-slate-300 text-xs italic">Invalid ID</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search size={48} className="text-slate-200 mb-4" />
                        <p className="text-lg font-medium text-slate-600">No leads found</p>
                        <p className="text-sm text-slate-400">Try adjusting your filters or search term</p>
                        <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm font-medium">Clear all filters</button>
                      </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
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
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
                <option value="Converted">Converted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
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
              <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">Select User...</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
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
            <button type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">{editingId ? 'Save Changes' : 'Create Lead'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
