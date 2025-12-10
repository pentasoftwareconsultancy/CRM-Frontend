
// Initial Data for Seed
const SEED_USERS = [
  { id: 'u1', name: 'Admin User', email: 'admin@nexuscrm.com', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff', status: 'Active' },
  { id: 'u2', name: 'Sales Manager', email: 'manager@nexuscrm.com', role: 'manager', avatar: 'https://ui-avatars.com/api/?name=Sales+Manager&background=random', status: 'Active' },
  { id: 'u3', name: 'Ankit (Sales)', email: 'ankit@nexuscrm.com', role: 'sales', avatar: 'https://ui-avatars.com/api/?name=Ankit&background=random', status: 'Active' },
];

const SEED_LEADS = [
  { id: 'l1', name: 'John Doe', company: 'ABC Pvt Ltd', email: 'john@abc.com', phone: '9000000000', source: 'Website', status: 'Qualified', assignedTo: 'u3', budget: 50000, city: 'Pune', description: 'Interested in CRM', createdAt: '2023-11-25T10:30:00.000Z', updatedAt: '2023-11-26T08:10:00.000Z' },
  { id: 'l2', name: 'Sarah Connor', company: 'Cyberdyne', email: 'sarah@cyberdyne.com', phone: '9876543210', source: 'Referral', status: 'New', assignedTo: 'u3', budget: 120000, city: 'Mumbai', description: 'Needs AI integration', createdAt: '2023-11-28T09:00:00.000Z', updatedAt: '2023-11-28T09:00:00.000Z' },
  { id: 'l3', name: 'Michael Scott', company: 'Dunder Mifflin', email: 'mscott@dunder.com', phone: '555-1234', source: 'Cold Call', status: 'Contacted', assignedTo: 'u2', budget: 5000, city: 'Scranton', description: 'Paper supply chain', createdAt: '2023-11-20T14:00:00.000Z', updatedAt: '2023-11-22T10:00:00.000Z' },
];

const SEED_DEALS = [
  { id: 'd1', leadId: 'l1', title: 'CRM Implementation', value: 75000, currency: 'INR', stage: 'Proposal Sent', expectedCloseDate: '2023-12-10', ownerId: 'u3', createdAt: '2023-11-25T12:00:00.000Z' },
  { id: 'd2', leadId: 'l2', title: 'AI Security Upgrade', value: 200000, currency: 'INR', stage: 'Negotiation', expectedCloseDate: '2023-12-15', ownerId: 'u3', createdAt: '2023-11-28T10:00:00.000Z' },
  { id: 'd3', leadId: 'l3', title: 'Yearly Paper Supply', value: 25000, currency: 'INR', stage: 'Won', expectedCloseDate: '2023-11-22', ownerId: 'u2', createdAt: '2023-11-20T15:00:00.000Z' },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to manage localStorage
const db = {
  get: (key, seed) => {
    const data = localStorage.getItem(`nexuscrm_${key}`);
    return data ? JSON.parse(data) : seed;
  },
  set: (key, data) => {
    localStorage.setItem(`nexuscrm_${key}`, JSON.stringify(data));
  }
};

class MockApiService {
  async login(email) {
    await delay(800);
    const users = db.get('users', SEED_USERS);
    // Determine user from seed or default to admin
    const user = users.find(u => u.email === email) || { 
      id: 'u_guest', name: 'Guest User', email, role: 'sales', avatar: 'https://ui-avatars.com/api/?name=Guest', status: 'Active'
    };
    
    if (user.status === 'Inactive') {
        throw new Error('User account is inactive');
    }

    const token = 'fake-jwt-token-123456';
    const userWithToken = { ...user, token };
    localStorage.setItem('nexuscrm_user', JSON.stringify(userWithToken));
    return userWithToken;
  }

  async logout() {
    localStorage.removeItem('nexuscrm_user');
  }

  async getCurrentUser() {
    const u = localStorage.getItem('nexuscrm_user');
    return u ? JSON.parse(u) : null;
  }

  // --- Users (Admin) ---
  async getUsers() {
    await delay(300);
    return db.get('users', SEED_USERS);
  }

  async addUser(userData) {
    await delay(500);
    const users = db.get('users', SEED_USERS);
    const newUser = {
      ...userData,
      id: `u${Date.now()}`,
      avatar: `https://ui-avatars.com/api/?name=${userData.name.replace(' ', '+')}&background=random`,
      status: 'Active'
    };
    db.set('users', [...users, newUser]);
    return newUser;
  }

  async updateUser(id, updates) {
    await delay(400);
    const users = db.get('users', SEED_USERS);
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    db.set('users', updatedUsers);
    return updatedUsers.find(u => u.id === id);
  }

  async deleteUser(id) {
    await delay(300);
    const users = db.get('users', SEED_USERS);
    const updatedUsers = users.filter(u => u.id !== id);
    db.set('users', updatedUsers);
  }

  // --- Leads ---
  async getLeads() {
    await delay(500);
    return db.get('leads', SEED_LEADS);
  }

  async addLead(leadData) {
    await delay(600);
    const leads = db.get('leads', SEED_LEADS);
    const newLead = {
      ...leadData,
      id: `l${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: leadData.status || 'New',
    };
    const updatedLeads = [newLead, ...leads];
    db.set('leads', updatedLeads);
    return newLead;
  }

  async updateLead(id, updates) {
    await delay(400);
    const leads = db.get('leads', SEED_LEADS);
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead not found');
    
    const updatedLead = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
    leads[index] = updatedLead;
    db.set('leads', leads);
    return updatedLead;
  }

  // --- Deals ---
  async getDeals() {
    await delay(500);
    return db.get('deals', SEED_DEALS);
  }

  async addDeal(dealData) {
    await delay(500);
    const deals = db.get('deals', SEED_DEALS);
    const newDeal = {
      ...dealData,
      id: `d${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.set('deals', [...deals, newDeal]);
    return newDeal;
  }

  async updateDealStage(dealId, stage) {
    await delay(300);
    const deals = db.get('deals', SEED_DEALS);
    const updatedDeals = deals.map(d => d.id === dealId ? { ...d, stage } : d);
    db.set('deals', updatedDeals);
  }

  // --- Stats ---
  async getDashboardStats() {
    await delay(600);
    const deals = db.get('deals', SEED_DEALS);
    const leads = db.get('leads', SEED_LEADS);

    const wonDeals = deals.filter(d => d.stage === 'Won');
    const totalRevenue = wonDeals.reduce((acc, curr) => acc + curr.value, 0);
    const pipelineValue = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').reduce((acc, curr) => acc + curr.value, 0);
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;
    const activeLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost').length;

    return {
      totalRevenue,
      activeLeads,
      pipelineValue,
      winRate: Math.round(winRate)
    };
  }
}

export const api = new MockApiService();
