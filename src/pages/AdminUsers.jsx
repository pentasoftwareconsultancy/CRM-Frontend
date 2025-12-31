// src/pages/AdminUsers.jsx (Final)

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, notificationService } from '../services/api';
import Modal from '../components/Modal';
import { UserPlus, Search, Edit2, Trash2, Shield, ShieldCheck, User as UserIcon, ChevronLeft, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Check for due follow-ups when admin visits this page
  useEffect(() => {
    if (user && user.role === 'admin') {
      notificationService.checkDueFollowUps().catch(err => {
        console.log('Failed to check due follow-ups:', err);
      });
    }
  }, [user]);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'sales', status: 'active', designation: ''
  });


  // Fetch Users with Pagination and Filters (2.1 GET /users)
  const { data: usersData, isLoading: loadingUsers, isFetching } = useQuery({
    queryKey: ['adminUsers', currentPage, limit, searchTerm],
    queryFn: () => userService.getUsers({
      page: currentPage,
      limit: limit,
      search: searchTerm,
      status: 'active|inactive'
    }),
    placeholderData: (previous) => previous,
    keepPreviousData: true,
  });

  const users = usersData?.data || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.ceil(totalUsers / limit);


  // Mutation for Add/Edit/Deactivate (2.2, 2.4, 2.5)
  const userMutation = useMutation({
    mutationFn: (data) => {
      if (editingUser) {
        return userService.updateUser(editingUser.id, data);
      }
      return userService.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      queryClient.invalidateQueries(['notifications_global_count']);
      setIsModalOpen(false);
      setEditingUser(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Operation Failed.');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => userService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: (err) => {
      alert(`Deactivation failed: ${err.response?.data?.message || err.message}`);
    }
  });

  // --- Handlers ---
  const handleOpenModal = (user = null) => {
    setError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        designation: user.designation || '',
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'sales', designation: '', status: 'active', password: '' });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // --- Client-Side Validation ---
    if (!formData.name || !formData.designation) {
      return setError('Full Name and Designation are required.');
    }

    const payload = {
      name: formData.name,
      role: formData.role,
      designation: formData.designation,
      status: formData.status
    };

    if (!editingUser) {
      if (!formData.email || !formData.password) {
        return setError('Email and Password are required for new users.');
      }
      if (formData.password.length < 6) {
        return setError('Password must be at least 6 characters long.');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return setError('Please enter a valid email address.');
      }

      payload.email = formData.email;
      payload.password = formData.password;
    }
    // --- End Validation ---

    userMutation.mutate(payload);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to deactivate this user? This is reversible.')) {
      deactivateMutation.mutate(id);
    }
  };

  // --- UI Helpers ---
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <ShieldCheck size={16} className="text-purple-600" />;
      case 'manager': return <Shield size={16} className="text-blue-600" />;
      default: return <UserIcon size={16} className="text-slate-500" />;
    }
  };
  const isLoading = loadingUsers || isFetching || userMutation.isPending || deactivateMutation.isPending;

  return (
    // Responsive padding
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Team Management ({totalUsers})</h2>
          <p className="text-sm text-slate-500 mt-1">Manage user access and roles.</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
            disabled={isLoading}
          >
            <UserPlus size={18} />
            Add User
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && <div className="p-12 text-center text-slate-500">Loading users...</div>}

        {!isLoading && filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Designation</th>
                  <th className="px-3 py-3">Created Date</th>
                  <th className="px-3 py-3">Updated Date</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`}
                          alt={u.name}
                          className="w-10 h-10 rounded-full border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 capitalize text-sm font-medium text-slate-700">
                        {getRoleIcon(u.role)}
                        {u.role}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${u.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      {u.designation || '-'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          <Edit2 size={16} />
                        </button>
                        {user.role === 'admin' && u.status === 'active' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls (made responsive) */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 gap-3">
        <p className="text-sm text-slate-600">
          Showing {Math.min(totalUsers, (currentPage - 1) * limit + 1)} - {Math.min(totalUsers, currentPage * limit)} of {totalUsers} users
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
            disabled={currentPage === totalPages || isLoading || totalUsers === 0}
            className="p-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal for Add/Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* General Fields */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Designation *</label>
              <input required type="text" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="sales">Sales Executive</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select disabled={!editingUser} className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none capitalize disabled:bg-slate-100" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Fields for NEW users */}
            {!editingUser && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (New) *</label>
                  <input required type="email" className="w-full rounded-lg border-slate-300 border px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password (New) *</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength="6"
                      className="w-full rounded-lg border-slate-300 border px-3 py-2 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">Cancel</button>
              <button type="submit" disabled={userMutation.isPending} className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20">
                {userMutation.isPending ? 'Processing...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;