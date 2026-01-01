// src/components/TopBar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, Menu } from 'lucide-react';
import { notificationService } from '../services/api';

const TopBar = ({ user, onMenuClick }) => {
  const navigate = useNavigate();

  // Browser Notifications Logic
  const lastNotifiedId = React.useRef(null);

  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Polling for notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications_global_count'],
    queryFn: () => notificationService.getNotifications({ limit: 10 }), // Smaller limit for polling
    staleTime: 60000,
    refetchInterval: 30000,
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : (notificationsData?.data || []);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Trigger browser notification for any new unread item
  React.useEffect(() => {
    if (notifications.length > 0) {
      const topUnread = notifications.find(n => !n.isRead);

      // Initialize the ref on first load so we don't alert old notifications
      if (!lastNotifiedId.current) {
        lastNotifiedId.current = topUnread ? topUnread._id : 'initial';
        return;
      }

      if (topUnread && topUnread._id !== lastNotifiedId.current) {
        // Only notify if window is not focused or just as a redundant alert
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('NexusCRM Update', {
            body: topUnread.message,
            icon: '/favicon.ico'
          });

          notification.onclick = () => {
            window.focus();
            navigate('/notifications');
          };
        }
        lastNotifiedId.current = topUnread._id;
      }
    }
  }, [notifications]);

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 shadow-sm">

      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="p-2 mr-4 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Placeholder to keep alignment */}
      <div className="flex-1"></div>

      <div className="flex items-center gap-6">
        {/* BELL ICON */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <>
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