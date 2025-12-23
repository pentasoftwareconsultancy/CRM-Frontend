import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, Calendar, UserPlus, Info, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/api';

const Notifications = () => {
  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
  });

  // Mark as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications_global_count']);
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'followup_due': return <Calendar className="text-amber-500" size={20} />;
      case 'lead_assigned': return <UserPlus className="text-blue-500" size={20} />;
      case 'deal_closed': return <CheckCircle className="text-emerald-500" size={20} />;
      default: return <Info className="text-slate-400" size={20} />;
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500">Loading notifications...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
          <p className="text-slate-500 mt-1">Stay updated with your latest CRM activities.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <Bell size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500">Your inbox is empty.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((note) => (
              <div 
                key={note.id} 
                className={`p-6 transition-colors flex items-center justify-between ${!note.isRead ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
              >
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    {getIcon(note.type)}
                  </div>
                  <div>
                    <p className={`text-sm ${!note.isRead ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                      {note.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!note.isRead && (
                  <button 
                    onClick={() => markReadMutation.mutate(note.id)}
                    className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Check size={14} />
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;