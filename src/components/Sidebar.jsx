// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Trello, BarChart3, 
  LogOut, Shield, CalendarClock, IndianRupeeIcon,
  ChevronLeft, Menu 
} from 'lucide-react';

const Sidebar = ({ onLogout, userRole, isCollapsed, setIsCollapsed }) => {
  // Local state removed - now using props

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: Users },
    { name: 'Pipeline', to: '/pipeline', icon: Trello },
    { name: 'Follow Ups', to: '/followups', icon: CalendarClock },
    { name: 'Customers', to: '/customers', icon: IndianRupeeIcon },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
  ];

  if (userRole === 'admin') {
    navItems.push({ name: 'Team', to: '/admin/users', icon: Shield });
  }

  return (
    <div className={`h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Header Area */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between overflow-hidden">
        {!isCollapsed && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
              NexusCRM
            </h1>
            <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">Enterprise Solution</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            title={isCollapsed ? item.name : ""}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="min-w-[20px]" />
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Area */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full rounded-lg transition-colors overflow-hidden"
        >
          <LogOut size={20} className="min-w-[20px]" />
          {!isCollapsed && (
            <span className="font-medium whitespace-nowrap">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;