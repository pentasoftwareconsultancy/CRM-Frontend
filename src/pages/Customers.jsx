// src/pages/Customers.jsx (Updated with all fields and validations)

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Building, Mail, Phone, Edit2, Link as LinkIcon, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Customers = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // FR-27 Fields defined in Customer Model
    const initialFormState = {
        name: '', email: '', phone: '', primaryContact: '', address: '', industry: '', website: '', billingInfo: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Customers (7.1)
    const { data: customers = [], isLoading: loadingCustomers } = useQuery({
        queryKey: ['customers', { searchTerm }],
        queryFn: () => customerService.getCustomers({ search: searchTerm }),
        placeholderData: [],
    });

    // Mutation for Add/Edit (7.2, 7.4)
    const customerMutation = useMutation({
        mutationFn: (data) => {
            // Note: If creating manually (7.2), the API expects the owner to be set.
            // If the backend doesn't automatically assign the logged-in user, 
            // we should manually add: ...data, owner: user.id 
            const payload = { ...data, owner: data.owner || user.id }; 
            
            return editingCustomer 
                ? customerService.updateCustomer(editingCustomer.id, payload) 
                : customerService.createCustomer(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            setIsModalOpen(false);
            setEditingCustomer(null);
            setFormData(initialFormState);
        },
        onError: (error) => {
            alert(`Operation Failed: ${error.response?.data?.message || error.message}`);
        }
    });

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            // Destructure all fields for editing
            setFormData({
                name: customer.name, email: customer.email, phone: customer.phone, primaryContact: customer.primaryContact,
                address: customer.address || '', industry: customer.industry || '', website: customer.website || '', billingInfo: customer.billingInfo || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        customerMutation.mutate(formData);
    };

    const isLoading = loadingCustomers || customerMutation.isPending;
    const canCreateManual = user.role === 'admin' || user.role === 'manager';

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
                    <p className="text-slate-500 mt-1">Confirmed clients converted from WON deals.</p>
                </div>
                {canCreateManual && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-blue-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                        disabled={isLoading}
                    >
                        <Plus size={18} />
                        Add Customer (Manual)
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                <input
                    type="text"
                    placeholder="Search customers by name or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
            </div>

            {/* Customer List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">Loading customers...</div>
                ) : customers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No customers found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Primary Contact</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Website</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Building size={20} className="text-indigo-500" />
                                                <p className="font-semibold text-slate-800">{c.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <UserIcon size={14} className="text-slate-400" /> {c.primaryContact}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Mail size={12} className="text-slate-400" /> {c.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Phone size={12} className="text-slate-400" /> {c.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-blue-500 hover:underline">
                                            {c.website ? (
                                                <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                    <LinkIcon size={14} /> {c.website.replace(/https?:\/\//, '').substring(0, 20)}...
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleOpenModal(c)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit Customer (FR-27) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer (7.2)'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Required Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                            <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact *</label>
                            <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.primaryContact} onChange={e => setFormData({...formData, primaryContact: e.target.value})} />
                        </div>
                    </div>
                    
                    {/* Contact Info (FR-27) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                            <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input type="tel" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    {/* Address & Website */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input type="url" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" placeholder="e.g., https://example.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                            <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>

                    {/* Billing Info (FR-27) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Info / Notes</label>
                        <textarea rows="3" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none resize-none" value={formData.billingInfo} onChange={e => setFormData({...formData, billingInfo: e.target.value})}></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" disabled={customerMutation.isPending} className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
                            {customerMutation.isPending ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;