// src/pages/Dashboard.jsx (FINAL VERSION - Including robust formatter logic)

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService, leadService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { IndianRupeeIcon, Users, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Helper to calculate percentage change (remains the same)
const calculateTrend = (current, previous) => {
  const currentVal = parseFloat(current) || 0;
  const previousVal = parseFloat(previous) || 0;

  if (previousVal === 0) {
    if (currentVal > 0) return { trend: '+100%', trendUp: true };
    return { trend: '0%', trendUp: true };
  }

  const diff = currentVal - previousVal;
  const percent = ((diff / previousVal) * 100).toFixed(1);

  return {
    trend: `${percent > 0 ? '+' : ''}${percent}%`,
    trendUp: percent >= 0
  };
};


const Dashboard = () => {
  // 1. Fetch Dashboard Stats (KPIs & Trends for 30 days)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: reportService.getDashboardStats,
  });

  // 2. Fetch Lead Sources (for Pie Chart)
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadService.getLeads().then(data => data.data),
    select: (data) => data.map(l => l.source),
  });

  // 3. Fetch Weekly Performance Data (for Bar Chart)
  const { data: performanceData = [], isLoading: loadingPerformance } = useQuery({
    queryKey: ['weeklyPerformance'],
    queryFn: reportService.getWeeklyPerformance,
  });


  // --- Chart Data Calculation ---
  const sourceCounts = leads.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f472b6'];

  if (loadingStats || loadingLeads || loadingPerformance) return <div className="p-8 flex justify-center text-slate-500">Loading Dashboard...</div>;

  // --- Trend Calculations ---
  const revenueTrend = calculateTrend(stats?.totalRevenue, stats?.prevWonValue);
  const leadsTrend = calculateTrend(stats?.newLeads, stats?.prevLeads);
  const winRateTrend = calculateTrend(stats?.winRate, stats?.prevWinRate);


  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, here's what's happening today.</p>
      </div>

      {/* KPI Cards (Now using calculated trends) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Won Revenue (30 Days)"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={IndianRupeeIcon}
          trend={revenueTrend.trend}
          trendUp={revenueTrend.trendUp}
          color="bg-blue-500"
        />
        <KpiCard
          title="New Leads (30 Days)"
          value={stats?.newLeads || 0}
          icon={Users}
          trend={leadsTrend.trend}
          trendUp={leadsTrend.trendUp}
          color="bg-emerald-500"
        />
        <KpiCard
          title="Pipeline Value (Current)"
          value={`₹${(stats?.pipelineValue || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend="N/A"
          color="bg-amber-500"
        />
        <KpiCard
          title="Win Rate (30 Days)"
          value={`${stats?.winRate || 0}%`}
          icon={Target}
          trend={winRateTrend.trend}
          trendUp={winRateTrend.trendUp}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart (Weekly Performance) */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Sales Performance (Revenue & Leads)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                {/* Revenue Y-Axis (Left) */}
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                {/* Leads Y-Axis (Right) */}
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} />

                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: '#f1f5f9' }}
                  // ROBUST FORMATTER: Checks the dataKey passed by the Bar component
                  formatter={(value, name, props) => {
                    if (props.dataKey === 'sales') {
                      return [`₹${value.toLocaleString()}`, 'Revenue'];
                    }
                    return [value, 'Leads'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} name="Revenue" />
                <Bar yAxisId="right" dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} name="Leads" />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Pie Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Lead Sources ({leads.length} Total)</h3>
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
                  nameKey="name"
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
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modified KpiCard to display trends
const KpiCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && trend !== 'N/A' && (
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </span>
        <span className="text-xs text-slate-400">vs last 30 days</span>
      </div>
    )}
    {trend === 'N/A' && (
      <div className="mt-4">
        <span className="text-xs text-slate-400">Cumulative total</span>
      </div>
    )}
  </div>
);

export default Dashboard;