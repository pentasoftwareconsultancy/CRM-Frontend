// src/services/api.js (FINAL & COMPLETE)

import axios from 'axios';

// Configure Axios instance
const API_BASE_URL = 'http://localhost:5000/api'; 
const apiService = axios.create({
  baseURL: API_BASE_URL,
});

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
  
  // FR-10 Export: Must request BLOB type
  exportLeads: async (params = {}) => {
    const res = await apiService.get('/leads/export', { 
        params,
        responseType: 'blob' // CRITICAL for file download
    });
    return res.data; 
  },

  // FR-10 Import Placeholder (Backend returns 501)
  importLeads: async (formData) => {
    const res = await apiService.post('/leads/import', formData);
    return res.data;
  }
};

// --- Deal/Pipeline (4.0) ---
export const dealService = {
  getDeals: async (params = {}) => {
    const res = await apiService.get('/deals', { params });
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
  deleteDeal: async (id) => { 
    const res = await apiService.delete(`/deals/${id}`);
    return res.data;
  },
};

// --- Customer Management (7.0) ---
export const customerService = {
  getCustomers: async (params = {}) => {
    const res = await apiService.get('/customers', { params }); 
    return res.data.map(c => ({ ...c, id: c._id }));
  },
  getCustomer: async (id) => {
    const res = await apiService.get(`/customers/${id}`); 
    return { ...res.data, id: res.data._id };
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


// --- Activities & Notes (5.0, 6.0) ---
export const activityService = {
  getFollowUps: async (params = { status: 'pending' }) => {
    const res = await apiService.get('/followups', { params });
    return res.data.map(f => ({ ...f, id: f._id }));
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
    const res = await apiService.get('/notifications'); 
    return res.data.map(n => ({ ...n, id: n._id }));
  },
  markNotificationRead: async (id) => {
    const res = await apiService.patch(`/notifications/${id}/read`); 
    return res.data;
  },
};

// --- Reports & Dashboard (8.0) ---
export const reportService = {
  getDashboardStats: async () => {
    const res = await apiService.get('/reports/overview');
    return {
      totalRevenue: res.data.wonValue,
      activeLeads: res.data.totalLeads,
      pipelineValue: res.data.pipelineValue,
      winRate: 0 
    };
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