
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../services/mockApi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const performanceData = [
    { name: 'Mon', sales: 4000, leads: 24 },
    { name: 'Tue', sales: 3000, leads: 13 },
    { name: 'Wed', sales: 2000, leads: 38 },
    { name: 'Thu', sales: 2780, leads: 39 },
    { name: 'Fri', sales: 1890, leads: 48 },
    { name: 'Sat', sales: 2390, leads: 38 },
    { name: 'Sun', sales: 3490, leads: 43 },
  ];

  const sourceData = [
    { name: 'Website', value: 400 },
    { name: 'Referral', value: 300 },
    { name: 'LinkedIn', value: 300 },
    { name: 'Cold Call', value: 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="p-8 flex justify-center text-slate-500">Loading Dashboard...</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12.5%" 
          trendUp={true} 
          color="bg-blue-500"
        />
        <KpiCard 
          title="Active Leads" 
          value={stats?.activeLeads || 0} 
          icon={Users} 
          trend="+4.2%" 
          trendUp={true} 
          color="bg-emerald-500"
        />
        <KpiCard 
          title="Pipeline Value" 
          value={`$${(stats?.pipelineValue || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          trend="-2.1%" 
          trendUp={false} 
          color="bg-amber-500"
        />
        <KpiCard 
          title="Win Rate" 
          value={`${stats?.winRate || 0}%`} 
          icon={Target} 
          trend="+1.5%" 
          trendUp={true} 
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Lead Sources</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {sourceData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className={`flex items-center text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </span>
      <span className="text-xs text-slate-400">vs last month</span>
    </div>
  </div>
);

export default Dashboard;
