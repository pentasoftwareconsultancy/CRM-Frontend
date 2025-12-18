// src/components/TopBar.jsx (UPDATED with React Query)

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Search, Check, X, User } from 'lucide-react';
import { notificationService } from '../services/api'; // Assuming you add notificationService to api.js

// --- 3.8 Notification Service Implementation ---
// NOTE: We need to add notificationService to src/services/api.js first.

// Add this to src/services/api.js (if not already done):
/*
// --- Notification Service (9.0) ---
export const notificationService = {
  getNotifications: async () => {
    const res = await apiService.get('/notifications'); // 9.1 GET /notifications
    return res.data.map(n => ({ ...n, id: n._id }));
  },
  markNotificationRead: async (id) => {
    const res = await apiService.patch(`/notifications/${id}/read`); // 9.2 PATCH /notifications/:id/read
    return res.data;
  },
};
*/

const NotificationPanel = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  // Fetch Notifications (9.1 GET /notifications)
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    // Only fetch if the panel is open
    enabled: isOpen,
    placeholderData: [],
  });

  // Mutation for Mark as Read (9.2 PATCH /notifications/:id/read)
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markNotificationRead(id),
    onMutate: async (id) => {
        // Optimistic Update: Mark notification as read immediately in the cache
        await queryClient.cancelQueries(['notifications']);
        const previousNotifications = queryClient.getQueryData(['notifications']);

        queryClient.setQueryData(['notifications'], (old) => 
            old ? old.map(n => (n.id === id ? { ...n, isRead: true } : n)) : []
        );
        return { previousNotifications };
    },
    onError: (err, id, context) => {
        // Rollback on failure
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        console.error("Failed to mark notification as read", err);
    },
    onSettled: () => {
        // Ensure the list is fresh after mutation attempt
        queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleMarkAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">Notifications ({unreadCount} New)</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((note) => (
              <div 
                key={note.id} // Use 'id' from normalized API response
                className={`p-4 hover:bg-slate-50 transition-colors ${!note.isRead ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!note.isRead ? 'bg-blue-500' : 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${!note.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {note.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!note.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(note.id)}
                      className="text-blue-500 hover:bg-blue-100 p-1 rounded transition-colors self-start"
                      title="Mark as read"
                      disabled={markReadMutation.isPending}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TopBar = ({ user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  
  // To update the red dot count when fetching. 
  // We fetch a simplified, disabled version of the notifications query globally
  const { data: globalNotifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    enabled: false, // Don't run this query on mount, only when panel opens
  });
  const unreadCount = globalNotifications.filter(n => !n.isRead).length;


  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
          <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </div>
        
        <Link to="/profile" className="flex items-center gap-3 pl-6 border-l border-slate-200 group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
            <div className="flex items-center justify-end gap-1">
              {user?.role === 'admin' && (
                <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Admin</span>
              )}
              {user?.role !== 'admin' && (
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-primary transition-colors">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
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