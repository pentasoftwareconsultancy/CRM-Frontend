import React from 'react';
import { Bell, Search } from 'lucide-react';

const TopBar = ({ user }) => {
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
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;