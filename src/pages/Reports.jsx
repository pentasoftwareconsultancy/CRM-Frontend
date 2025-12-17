
import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { api } from '../services/mockApi';
import { FileDown, Users, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, team, sources

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const reportData = await api.getReportData();
        setData(reportData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleExport = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add Pipeline Data
    csvContent += "Pipeline Stage,Count\n";
    data.pipelineData.forEach(row => {
        csvContent += `${row.name},${row.value}\n`;
    });

    // Add Team Performance
    csvContent += "\nSales Rep,Assigned Leads,Won Deals\n";
    data.teamPerformance.forEach(row => {
        csvContent += `${row.name},${row.assignedLeads},${row.wonDeals}\n`;
    });

    // Add Conversion Data
    csvContent += "\nSource,Conversion Rate (%)\n";
    data.conversionData.forEach(row => {
        csvContent += `${row.name},${row.rate}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexus_crm_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Custom Tooltip Style
  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px'
  };

  // Medium Blue Hover Style for Bar Charts
  const cursorStyle = { fill: 'rgba(59, 130, 246, 0.1)' };

  if (loading) return <div className="p-12 text-center text-slate-500">Generating analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-500 mt-1">Deep dive into your sales metrics and team performance.</p>
        </div>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-primary hover:border-primary transition-all"
        >
          <FileDown size={16} />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChartIcon size={16} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} /> Team Performance
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'sources' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp size={16} /> Lead Sources
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Overview Tab Content */}
        {activeTab === 'overview' && data?.pipelineData && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Pipeline Volume by Stage</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={cursorStyle} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Deals Count" barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Deal Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.pipelineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Key Metrics</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Total Deals in Pipeline</span>
                        <span className="font-bold text-slate-900">{data.pipelineData.reduce((acc, c) => acc + c.value, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Deals Won</span>
                        <span className="font-bold text-emerald-600">{data.pipelineData.find(d => d.name === 'Won')?.value || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Deals Lost</span>
                        <span className="font-bold text-red-600">{data.pipelineData.find(d => d.name === 'Lost')?.value || 0}</span>
                    </div>
                </div>
            </div>
          </>
        )}

        {/* Team Performance Content */}
        {activeTab === 'team' && data?.teamPerformance && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Rep Performance</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teamPerformance} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={cursorStyle} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="assignedLeads" name="Assigned Leads" fill="#94a3b8" barSize={20} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="wonDeals" name="Deals Won" fill="#10b981" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sources Content */}
        {activeTab === 'sources' && data?.conversionData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Lead Source Conversion Rate (%)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.conversionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={cursorStyle} contentStyle={tooltipStyle} />
                  <Bar dataKey="rate" name="Conversion Rate %" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
