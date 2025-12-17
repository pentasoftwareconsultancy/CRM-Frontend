import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, BarChart3, Settings, LogOut, Shield, CalendarClock } from 'lucide-react';

const Sidebar = ({ onLogout, userRole }) => {
  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: Users },
    { name: 'Lead', to: '/lead', icon: Users },
    { name: 'Pipeline', to: '/pipeline', icon: Trello },
    { name: 'Follow Ups', to: '/followups', icon: CalendarClock },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
  ];

  if (userRole === 'admin') {
    navItems.push({ name: 'Team', to: '/admin/users', icon: Shield });
  }

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          NexusCRM
        </h1>
        <p className="text-xs text-slate-400 mt-1">Enterprise Solution</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;