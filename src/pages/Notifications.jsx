import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Quote, UserPlus, Bell, Circle } from 'lucide-react';
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
    <div className="core-rail" style={{ gridTemplateColumns: '260px 1fr' }}>
      <div>
        <div className="card network-sidebar">
           <h2 style={{fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)'}}>Manage Notifications</h2>
           <div className="network-nav-item" style={{background: '#f1f5f9', color:'var(--text-primary)'}}><span>All</span></div>
           <button 
             className="btn-secondary" 
             onClick={markAllRead}
             style={{ width: '100%', marginTop: 12, fontSize: 13, padding: '8px' }}
           >
             Mark all as read
           </button>
        </div>
      </div>
      <div>
        <div className="card" style={{ padding: '24px 0' }}>
           <h1 style={{fontSize: 20, fontWeight: 700, marginBottom: 24, padding: '0 24px'}}>Notifications</h1>
           
           {loading ? (
             <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
           ) : notifications.length === 0 ? (
             <div style={{ padding: 48, textAlign: 'center' }}>
               <Bell size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
               <p style={{ color: 'var(--text-secondary)' }}>No new notifications</p>
             </div>
           ) : notifications.map(n => (
             <div 
               key={n._id} 
               onClick={() => !n.read && markAsRead(n._id)}
               className="item-card" 
               style={{ 
                 padding: '16px 24px', 
                 cursor: 'pointer', 
                 background: n.read ? 'transparent' : '#f8fafc',
                 borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent-color)',
                 transition: 'all 0.2s'
               }}
             >
                <div className="item-icon" style={{
                  background: n.type === 'like' ? '#f3e8ff' : '#e0f2fe',
                  color: n.type === 'like' ? '#a855f7' : '#0284c7'
                }}>
                  {n.type === 'like' ? <ThumbsUp size={20} /> : <MessageSquare size={20} />}
                </div>
                <div className="item-content">
                   <div style={{ fontSize: 15 }}>
                     <strong>{n.sender?.name || 'Researcher'}</strong> {n.content}
                   </div>
                   <div className="item-meta" style={{marginTop: 4}}>
                     {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
