// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Trello, BarChart3,
  LogOut, Shield, CalendarClock, IndianRupeeIcon,
  ChevronLeft, Menu, X
} from 'lucide-react';

const Sidebar = ({ onLogout, userRole, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, color: 'text-sky-400', activeBg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { name: 'Leads', to: '/leads', icon: Users, color: 'text-amber-400', activeBg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'Pipeline', to: '/pipeline', icon: Trello, color: 'text-indigo-400', activeBg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { name: 'Follow Ups', to: '/followups', icon: CalendarClock, color: 'text-rose-400', activeBg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { name: 'Customers', to: '/customers', icon: IndianRupeeIcon, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'Reports', to: '/reports', icon: BarChart3, color: 'text-purple-400', activeBg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  if (userRole === 'admin') {
    navItems.push({ name: 'Team', to: '/admin/users', icon: Shield, color: 'text-teal-400', activeBg: 'bg-teal-500/10', border: 'border-teal-500/20' });
  }

  const showFullContent = !isCollapsed || isMobileOpen;

  const handleNavLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <div
      className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-xl z-50
      ${isCollapsed ? 'lg:w-20' : 'lg:w-50'}
      w-0 overflow-hidden ${isMobileOpen ? 'fixed w-64 translate-x-0' : 'fixed -translate-x-full'}
      lg:static lg:w-auto lg:translate-x-0`}
    >

      {/* Header Area */}
      <div className="pt-4 pb-5 pl-4 pr-1 border-b border-slate-800 flex items-start justify-between lg:w-full">
        {showFullContent && (
          <div className="lg:w-auto w-40 animate-in fade-in duration-500 transform translate-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap">
              SmartCRM
            </h1>
            <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">Enterprise Solution</p>
          </div>
        )}

        {/* Desktop Collapse Button - ALWAYS visible on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors hidden lg:block -mt-1"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Mobile Close Button - Only visible when mobile is open */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            title={isCollapsed && !isMobileOpen ? item.name : ""}
            onClick={handleNavLinkClick}
            className={({ isActive }) =>
              `group relative flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 border border-transparent ${isActive
                ? `${item.activeBg} ${item.border} text-white shadow-sm`
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }
              ${isCollapsed && !isMobileOpen ? 'lg:justify-center' : ''}
              `
            }
          >
            <item.icon
              size={20}
              className={`min-w-[20px] transition-colors duration-300 ${item.color} ${isCollapsed && !isMobileOpen ? '' : 'group-hover:scale-110'}`}
            />

            {showFullContent && (
              <span className="font-medium whitespace-nowrap">
                {item.name}
              </span>
            )}

            {isCollapsed && !isMobileOpen && (
              <span className="absolute left-full ml-4 px-3 py-1 bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block pointer-events-none">
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
          className={`flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full rounded-lg transition-colors overflow-hidden 
          ${isCollapsed && !isMobileOpen ? 'lg:justify-center' : ''}`}
        >
          <LogOut size={20} className="min-w-[20px]" />
          {showFullContent && (
            <span className="font-medium whitespace-nowrap">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;