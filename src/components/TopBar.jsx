// src/components/TopBar.jsx (REVISED)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search } from 'lucide-react';
import { notificationService } from '../services/api'; 

const TopBar = ({ user }) => {
  const navigate = useNavigate();

  // Keep the polling logic here to update the red dot count everywhere
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications_global_count'],
    queryFn: notificationService.getNotifications,
    staleTime: 60000, 
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search leads, deals..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* BELL ICON: Now a Link to the Notifications Page */}
        <Link 
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <>
              {/* Red Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              {/* Number Badge (Optional) */}
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          )}
        </Link>
        
        <Link to="/profile" className="flex items-center gap-3 pl-6 border-l border-slate-200 group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold border-2 border-white shadow-sm group-hover:border-primary transition-colors">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;