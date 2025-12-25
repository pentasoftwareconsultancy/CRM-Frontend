// src/components/TopBar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, Menu } from 'lucide-react';
import { notificationService } from '../services/api'; 

const TopBar = ({ user, onMenuClick }) => {
  const navigate = useNavigate();

  // Polling for notification count
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications_global_count'],
    queryFn: notificationService.getNotifications,
    staleTime: 60000, 
    refetchInterval: 30000, 
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
      
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick} 
        className="p-2 mr-4 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Search Input (Hidden on mobile for now) */}
      <div className="flex items-center gap-4 w-96 hidden sm:flex">
        {/* Placeholder for search or breadcrumbs if needed */}
        <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* BELL ICON */}
        <Link 
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1 shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </Link>
        
        {/* PROFILE SECTION */}
        <Link to="/profile" className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-slate-200 group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize font-medium bg-slate-100 px-1.5 py-0.5 rounded text-center">
              {user?.role || 'Guest'}
            </p>
          </div>

          {/* AVATAR CONTAINER */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-primary transition-colors flex shrink-0 bg-slate-200">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                // Fallback if image fails to load
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full bg-primary text-white flex items-center justify-center font-bold uppercase text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;