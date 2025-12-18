// src/services/api.js (REVISED to include all services)

import axios from 'axios';

// Configure Axios instance
const API_BASE_URL = 'http://localhost:5000/api'; // Ensure this matches your backend PORT
const apiService = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token (FR-2)
apiService.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || 'null'); // Use 'user' key from authStore
  const token = user ? user.token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
    return Promise.reject(error);
});

// --- Authentication Service (FR-1, 1.2) ---
export const authService = {
  login: async (email, password) => {
    const res = await apiService.post('/auth/login', { email, password });
    return { ...res.data.user, token: res.data.token };
  },
  logout: () => {
    return Promise.resolve();
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiService.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

// --- User Management (2.0 - Admin Only) ---
export const userService = {
  getUsers: async (filters = {}) => {
    const res = await apiService.get('/users', { params: filters });
    // Normalize data structure for frontend consistency (using 'id' instead of '_id')
    return res.data.map(u => ({ ...u, id: u._id }));
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
};

// --- Lead Management (3.0) ---
export const leadService = {
  getLeads: async (params = {}) => {
    const res = await apiService.get('/leads', { params });
    // Normalize lead data and assignedTo field
    const leads = res.data.data.map(l => ({ ...l, id: l._id }));
    return { ...res.data, data: leads };
  },
  getLead: async (id) => {
    const res = await apiService.get(`/leads/${id}`);
    return { ...res.data, id: res.data._id };
  },
  addLead: async (leadData) => {
    const res = await apiService.post('/leads', leadData);
    return res.data;
  },
  updateLead: async (id, updates) => {
    const res = await apiService.put(`/leads/${id}`, updates);
    return res.data;
  },
};

// --- Deal/Pipeline (4.0) ---
export const dealService = {
  getDeals: async (params = {}) => {
    const res = await apiService.get('/deals', { params });
    // Ensure deals are returned with 'id'
    return res.data.map(d => ({ ...d, id: d._id }));
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
};
export const customerService = {
  getCustomers: async (params = {}) => {
    const res = await apiService.get('/customers', { params }); // 7.1
    return res.data.map(c => ({ ...c, id: c._id }));
  },
  getCustomer: async (id) => {
    const res = await apiService.get(`/customers/${id}`); // 7.3
    return { ...res.data, id: res.data._id };
  },
  createCustomer: async (customerData) => {
    const res = await apiService.post('/customers', customerData); // 7.2
    return res.data;
  },
  updateCustomer: async (id, updates) => {
    const res = await apiService.put(`/customers/${id}`, updates); // 7.4
    return res.data;
  },
};


// --- Activities & Notes (5.0, 6.0) ---
export const activityService = {
  getFollowUps: async (params = { status: 'pending' }) => {
    const res = await apiService.get('/followups', { params });
    return res.data.map(f => ({ ...f, id: f._id }));
  },
  createFollowUp: async (leadId, data) => {
    // Note: The API path is POST /leads/:leadId/followups
    const res = await apiService.post(`/leads/${leadId}/followups`, data);
    return res.data;
  },
  completeFollowUp: async (id, data) => {
    const res = await apiService.patch(`/followups/${id}/complete`, data);
    return res.data;
  },
  getLeadNotes: async (leadId) => {
    const res = await apiService.get(`/leads/${leadId}/notes`);
    return res.data.map(n => ({ ...n, id: n._id }));
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

// --- Notification Service (9.0) ---
export const notificationService = {
  getNotifications: async () => {
    const res = await apiService.get('/notifications'); // 9.1 GET /notifications
    // Note: backend implementation is needed for /notifications
    return res.data.map(n => ({ ...n, id: n._id }));
  },
  markNotificationRead: async (id) => {
    const res = await apiService.patch(`/notifications/${id}/read`); // 9.2 PATCH /notifications/:id/read
    return res.data;
  },
};

// --- Reports & Dashboard (8.0) ---
export const reportService = {
  getDashboardStats: async () => {
    // 8.1 GET /reports/overview
    const res = await apiService.get('/reports/overview');
    // Normalize to match frontend mock keys
    return {
      totalRevenue: res.data.wonValue,
      activeLeads: res.data.totalLeads,
      pipelineValue: res.data.pipelineValue,
      winRate: 0 // Cannot calculate win rate accurately without total attempts/time filtering
    };
  },
  getReports: async () => {
    // Fetch multiple reports for the Reports page
    const [overview, teamPerformance, conversion] = await Promise.all([
      apiService.get('/reports/overview'),
      apiService.get('/reports/sales-performance'),
      apiService.get('/reports/conversion-rate')
    ]);

    // Simplified mock-like structure for frontend charts
    return {
      pipelineData: [
        { name: 'Total Leads', value: overview.data.totalLeads },
        { name: 'New Leads', value: overview.data.newLeads },
        { name: 'Won Deals', value: overview.data.wonDeals },
        { name: 'Lost Deals', value: overview.data.lostDeals },
      ],
      teamPerformance: teamPerformance.data.map(u => ({
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