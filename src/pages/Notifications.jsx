import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Quote, UserPlus, Bell, Circle, Repeat2, Share2, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/notifications')
      .then(res => setNotifications(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="layout-container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, padding: '24px' }}>
      {/* List sidebar */}
      <div>
        <div className="card" style={{ padding: 16 }}>
           <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Manage Notifications</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <button style={{ 
               textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: '#f1f5f9', border: 'none', 
               color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' 
             }}>
               All Notifications
             </button>
             <button 
               onClick={markAllRead}
               style={{ 
                 textAlign: 'left', padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', 
                 color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' 
               }}
             >
               Mark all as read
             </button>
           </div>
        </div>
      </div>

      {/* Main content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Notifications</h1>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
            <p>Cleaning up your feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <Bell size={64} style={{ margin: '0 auto 16px', color: 'var(--border-color)', opacity: 0.5 }} />
            <h3 style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>No notifications yet</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>When researchers like, share, or comment on your work, you'll see it here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map(n => {
              let Icon = Bell;
              let color = 'var(--text-secondary)';
              let bg = '#f1f5f9';

              if (n.type === 'like') { Icon = ThumbsUp; color = '#a855f7'; bg = '#f3e8ff'; }
              else if (n.type === 'comment') { Icon = MessageSquare; color = '#0284c7'; bg = '#e0f2fe'; }
              else if (n.type === 'share') { Icon = Repeat2; color = '#16a34a'; bg = '#dcfce7'; }
              else if (n.type === 'follow' || n.type === 'collaboration_request') { Icon = UserPlus; color = '#7c3aed'; bg = '#ede9fe'; }
              else if (n.type === 'new_post') { Icon = Bell; color = '#d97706'; bg = '#fef3c7'; }

              return (
                <div 
                  key={n._id} 
                  onClick={() => !n.read && markAsRead(n._id)}
                  style={{ 
                    padding: '16px 24px', 
                    cursor: 'pointer', 
                    background: n.read ? 'transparent' : '#f8fafc',
                    borderLeft: n.read ? '4px solid transparent' : `4px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: 44, height: 44, borderRadius: '50%', background: bg, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                      <strong style={{ fontWeight: 700 }}>{n.sender?.name || 'Researcher'}</strong> {n.content}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 10, height: 10, background: 'var(--accent-color)', borderRadius: '50%' }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
