// src/services/api.js (FINAL)

import axios from 'axios';

// Configure Axios instance
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';
const apiService = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to normalize responses that may either return an array directly
// or a wrapper object { data: [...] }
const normalizeList = (res) => Array.isArray(res.data) ? res.data : (res.data.data || []);
const normalizeSingle = (res) => (res.data && res.data.data) ? res.data.data : res.data;

// Request interceptor to attach JWT token (FR-2)
apiService.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = user ? user.token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// --- Authentication Service (remains the same) ---
export const authService = {
  login: async (email, password) => {
    const res = await apiService.post('/auth/login', { email, password });
    const user = res.data.user;
    return { ...user, id: user._id, token: res.data.token };
  },
  logout: () => {
    return Promise.resolve();
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiService.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

// --- User Management (remains the same) ---
export const userService = {
  // Returns paged response
  getUsers: async (filters = {}) => {
    const res = await apiService.get('/users', { params: filters });
    const list = normalizeList(res).map(u => ({ ...u, id: u._id }));
    // Preserve wrapper fields like page/total if present
    return { ...res.data, data: list };
  },
  getAssignees: async () => {
    const res = await apiService.get('/users/assignees');
    const list = normalizeList(res).map(u => ({ ...u, id: u._id }));
    return list; // Return array directly
  },
  createUser: async (userData) => {
    const res = await apiService.post('/users', userData);
    return res.data;
  },
  updateUser: async (id, updates) => {
    const res = await apiService.put(`/users/${id}`, updates);
    return res.data;
  },
  deactivateUser: async (id) => {
    const res = await apiService.delete(`/users/${id}`);
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await apiService.put('/users/profile', profileData);
    return res.data;
  },
};

// --- Lead Management (3.0) ---
export const leadService = {
  getLeads: async (params = {}) => {
    const res = await apiService.get('/leads', { params });
    const leads = normalizeList(res).map(l => ({ ...l, id: l._id }));
    return { ...res.data, data: leads };
  },
  getLead: async (id) => {
    const res = await apiService.get(`/leads/${id}`);
    const payload = normalizeSingle(res) || {};
    return { ...payload, id: payload._id };
  },
  addLead: async (leadData) => {
    const res = await apiService.post('/leads', leadData);
    return res.data;
  },
  updateLead: async (id, updates) => {
    const res = await apiService.put(`/leads/${id}`, updates);
    return res.data;
  },

  // FR-10 Export
  exportLeads: async (params = {}) => {
    const res = await apiService.get('/leads/export', {
      params,
      responseType: 'blob'
    });
    return res.data;
  },

  // FR-10 Import Placeholder
  importLeads: async (formData) => {
    const res = await apiService.post('/leads/import', formData);
    return res.data;
  },

  // 3.5 DELETE /leads/:id (NEWLY ADDED)
  deleteLead: async (id) => {
    const res = await apiService.delete(`/leads/${id}`);
    return res.data;
  }
};

// --- Deal/Pipeline (remains the same) ---
export const dealService = {
  getDeals: async (params = {}) => {
    const res = await apiService.get('/deals', { params });
    const list = normalizeList(res).map(d => ({ ...d, id: d._id }));
    return list;
  },
  createDeal: async (dealData) => {
    const res = await apiService.post('/deals', dealData);
    return res.data;
  },
  updateDealStage: async (dealId, stage) => {
    const res = await apiService.patch(`/deals/${dealId}/stage`, { stage });
    return res.data;
  },
  closeDeal: async (dealId, status, reason) => {
    const res = await apiService.patch(`/deals/${dealId}/close`, { status, reason });
    return res.data;
  },
  deleteDeal: async (id) => {
    const res = await apiService.delete(`/deals/${id}`);
    return res.data;
  },
};

// --- Customer Management (remains the same) ---
export const customerService = {
  // Returns paged response
  getCustomers: async (params = {}) => {
    const res = await apiService.get('/customers', { params });
    const customers = normalizeList(res).map(c => ({ ...c, id: c._id }));
    return { ...res.data, data: customers };
  },
  getCustomer: async (id) => {
    const res = await apiService.get(`/customers/${id}`);
    const payload = normalizeSingle(res) || {};
    return { ...payload, id: payload._id };
  },
  createCustomer: async (customerData) => {
    const res = await apiService.post('/customers', customerData);
    return res.data;
  },
  updateCustomer: async (id, updates) => {
    const res = await apiService.put(`/customers/${id}`, updates);
    return res.data;
  },
};


// --- Activities & Notes (remains the same) ---
export const activityService = {
  // Returns paged response
  getFollowUps: async (params = {}) => {
    const res = await apiService.get('/followups', { params });
    const followups = normalizeList(res).map(f => ({ ...f, id: f._id }));
    return { ...res.data, data: followups };
  },
  createFollowUp: async (leadId, data) => {
    const res = await apiService.post(`/leads/${leadId}/followups`, data);
    return res.data;
  },
  completeFollowUp: async (id, data) => {
    const res = await apiService.patch(`/followups/${id}/complete`, data);
    return res.data;
  },
  getLeadNotes: async (leadId) => {
    const res = await apiService.get(`/leads/${leadId}/notes`);
    const list = normalizeList(res).map(n => ({ ...n, id: n._id }));
    return list;
  },
  addNote: async (leadId, content) => {
    const res = await apiService.post(`/leads/${leadId}/notes`, { content });
    return res.data;
  },
  getLeadActivities: async (leadId) => {
    const res = await apiService.get(`/leads/${leadId}/activities`);
    return res.data;
  }
};

// --- Notification Service (remains the same) ---
export const notificationService = {
  getNotifications: async () => {
    const res = await apiService.get('/notifications');
    const list = normalizeList(res).map(n => ({ ...n, id: n._id }));
    return list;
  },
  markNotificationRead: async (id) => {
    const res = await apiService.patch(`/notifications/${id}/read`);
    return res.data;
  },
};

// --- Reports & Dashboard (8.0) ---
export const reportService = {
  getDashboardStats: async () => {
    // Calls the backend, which now includes CP/PP calculations
    const res = await apiService.get('/reports/overview');

    // FIX: Extract all fields for trend calculation in frontend
    return {
      totalLeads: res.data.totalLeads,
      pipelineValue: res.data.pipelineValue,
      totalRevenue: res.data.wonValue,
      newLeads: res.data.newLeads,
      winRate: res.data.winRate,

      prevWonValue: res.data.prevWonValue,
      prevLeads: res.data.prevLeads,
      prevWinRate: res.data.prevWinRate,
    };
  },

  // NEW: Service to fetch weekly performance data
  getWeeklyPerformance: async () => {
    const res = await apiService.get('/reports/weekly-performance');
    return res.data;
  },

  getReports: async () => {
    const [overview, teamPerformance, conversion] = await Promise.all([
      apiService.get('/reports/overview'),
      apiService.get('/reports/sales-performance'),
      apiService.get('/reports/conversion-rate')
    ]);

    return {
      pipelineData: [
        { name: 'Total Leads', value: overview.data.totalLeads },
        { name: 'New Leads', value: overview.data.newLeads },
        { name: 'Won Deals', value: overview.data.wonDeals },
        { name: 'Lost Deals', value: overview.data.lostDeals },
        { name: 'Cancelled Deals', value: overview.data.cancelledDeals },
      ],
      teamPerformance: normalizeList(teamPerformance).map(u => ({
        name: u.user.name,
        assignedLeads: u.leadsAssigned,
        wonDeals: u.dealsWon,
      })),
      conversionData: [
        { name: 'Overall', rate: conversion.data.overallConversionRate, total: conversion.data.totalLeadsCreated }
      ]
    };
  }
};