import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Building, Mail, Phone, Edit2, Link as LinkIcon, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

const Customers = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // FR-27 Fields defined in Customer Model
    const initialFormState = {
        name: '', email: '', phone: '', primaryContact: '', address: '', industry: '', website: '', billingInfo: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Fetch Customers (7.1)
    const { data: customersData, isLoading: loadingCustomers, isFetching } = useQuery({
        queryKey: ['customers', { searchTerm, currentPage, limit }],
        queryFn: () => customerService.getCustomers({ search: searchTerm, page: currentPage, limit: limit }),
        placeholderData: (previousData) => previousData,
        keepPreviousData: true,
    });

    const customers = customersData?.data || [];
    const totalCustomers = customersData?.total || 0;
    const totalPages = Math.ceil(totalCustomers / limit);

    // Mutation for Add/Edit (7.2, 7.4)
    const customerMutation = useMutation({
        mutationFn: (data) => {
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

    const isLoading = loadingCustomers || isFetching || customerMutation.isPending;
    const canCreateManual = user.role === 'admin' || user.role === 'manager';

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Customer Management ({totalCustomers})</h2>
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
                {isLoading && <div className="p-12 text-center text-slate-500">Loading customers...</div>}

                {!isLoading && customers.length === 0 ? (
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
                                    <th className="px-6 py-4">Dates</th>
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
                                        {/* Dates Column */}
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            <p>Converted: {new Date(c.convertedDate).toLocaleDateString()}</p>
                                            <p>Updated: {new Date(c.updatedAt).toLocaleDateString()}</p>
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

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-600">
                    Showing {Math.min(totalCustomers, (currentPage - 1) * limit + 1)} - {Math.min(totalCustomers, currentPage * limit)} of {totalCustomers} customers
                </p>
                <div className="flex items-center gap-4">
                    <select
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                        className="rounded-lg border border-slate-300 text-sm py-1"
                        disabled={isLoading}
                    >
                        {[10, 20, 50].map(l => <option key={l} value={l}>{l} per page</option>)}
                    </select>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading || totalCustomers === 0}
                        className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>


            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer (7.2)'}>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Required Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                            <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact *</label>
                            <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.primaryContact} onChange={e => setFormData({ ...formData, primaryContact: e.target.value })} />
                        </div>
                    </div>

                    {/* Contact Info (FR-27) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                            <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input type="tel" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    {/* Address & Website */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input type="url" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" placeholder="e.g., https://example.com" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                            <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    {/* Billing Info (FR-27) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Info / Notes</label>
                        <textarea rows="3" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-primary outline-none resize-none" value={formData.billingInfo} onChange={e => setFormData({ ...formData, billingInfo: e.target.value })}></textarea>
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