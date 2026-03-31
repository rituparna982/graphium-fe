import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, Filter, FileText, LogIn, Users, Microscope, MessageSquare, 
  BookOpen, Settings, ChevronDown, ChevronUp, Activity, RefreshCw 
} from 'lucide-react';

// Category icons and colors for display
const CATEGORY_CONFIG = {
  auth: { label: 'Authentication', icon: LogIn, color: '#8b5cf6', bg: '#ede9fe' },
  post: { label: 'Posts', icon: FileText, color: '#10b981', bg: '#d1fae5' },
  lab: { label: 'Labs', icon: Microscope, color: '#3b82f6', bg: '#dbeafe' },
  collaboration: { label: 'Collaboration', icon: Users, color: '#f59e0b', bg: '#fef3c7' },
  message: { label: 'Messages', icon: MessageSquare, color: '#ec4899', bg: '#fce7f3' },
  conference: { label: 'Conference', icon: BookOpen, color: '#ef4444', bg: '#fee2e2' },
  profile: { label: 'Profile', icon: Settings, color: '#6366f1', bg: '#e0e7ff' },
  other: { label: 'Other', icon: Activity, color: '#64748b', bg: '#f1f5f9' },
};

// Action descriptions for display
const ACTION_LABELS = {
  login: '🔓 Logged in',
  register: '🎉 Registered account',
  register_existing: '🔓 Logged in (existing account)',
  guest_login: '👤 Guest login',
  oauth_login: '🔗 OAuth login',
  post_created: '📝 Created a post',
  post_updated: '✏️ Updated a post',
  post_deleted: '🗑️ Deleted a post',
  post_shared: '🔁 Shared a post',
  post_liked: '❤️ Liked a post',
  post_saved: '🔖 Saved a post',
  comment_added: '💬 Added a comment',
  lab_created: '🔬 Created a lab',
  lab_joined: '➕ Joined a lab',
  lab_left: '➖ Left a lab',
  lab_announcement: '📢 Posted lab announcement',
  lab_deleted: '🗑️ Deleted a lab',
  collab_requested: '🤝 Sent collaboration request',
  collab_accepted: '✅ Accepted collaboration',
  collab_declined: '❌ Declined collaboration',
  collab_removed: '🗑️ Removed collaboration',
  profile_updated: '⚙️ Updated profile',
};

function timeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchHistory = async (pageNum = 1, category = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 30 });
      if (category !== 'all') params.append('category', category);
      
      const res = await api.get(`/api/history?${params}`);
      if (pageNum === 1) {
        setHistory(res.data.history);
      } else {
        setHistory(prev => [...prev, ...res.data.history]);
      }
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('[HISTORY] Fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory(1, filter);
    setPage(1);
  }, [filter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, filter);
  };

  // Group history items by date
  const groupByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const groupedHistory = groupByDate(history);

  return (
    <div className="network-layout">
      {/* Sidebar with filters */}
      <div className="card network-sidebar">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} /> Activity History
        </h2>

        <div 
          className={`network-nav-item ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          style={{ cursor: 'pointer', fontWeight: filter === 'all' ? 700 : 400 }}
        >
          <span>All Activity</span>
          <span style={{ fontWeight: 600 }}>{pagination?.total || 0}</span>
        </div>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div 
              key={key} 
              className={`network-nav-item ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
              style={{ 
                cursor: 'pointer', 
                fontWeight: filter === key ? 700 : 400,
                color: filter === key ? config.color : 'inherit'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} /> {config.label}
              </span>
            </div>
          );
        })}

        <div style={{ marginTop: 20, padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn-secondary" 
            onClick={() => fetchHistory(1, filter)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main content */}
      <div>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Activity History</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Complete log of all your actions — never deleted
              </p>
            </div>
            <div style={{ 
              background: 'var(--accent-light)', 
              color: 'var(--accent-color)', 
              padding: '8px 16px', 
              borderRadius: 20, 
              fontWeight: 600, 
              fontSize: 14 
            }}>
              {pagination?.total || 0} total actions
            </div>
          </div>
        </div>

        {loading && history.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Clock size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No activity yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your actions will appear here as you use Graphium.
            </p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              {/* Date header */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                <span style={{ 
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', 
                  whiteSpace: 'nowrap', padding: '4px 12px', 
                  background: 'var(--bg-secondary)', borderRadius: 12 
                }}>
                  {date}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              </div>

              {/* History items */}
              {items.map(item => {
                const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                const CatIcon = catConfig.icon;
                const actionLabel = ACTION_LABELS[item.action] || item.action;

                return (
                  <div key={item._id} className="card" style={{ 
                    padding: '16px 20px', marginBottom: 8, 
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    cursor: 'default'
                  }}>
                    {/* Category icon */}
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: catConfig.bg, color: catConfig.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CatIcon size={18} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {actionLabel}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      )}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div style={{ 
                          marginTop: 6, padding: '6px 10px', background: '#f8fafc', 
                          borderRadius: 6, fontSize: 12, color: 'var(--text-tertiary)',
                          display: 'flex', gap: 12, flexWrap: 'wrap'
                        }}>
                          {Object.entries(item.metadata).map(([key, value]) => (
                            value && <span key={key}><strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div style={{ 
                      fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 
                    }}>
                      {timeAgo(item.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Load more */}
        {pagination?.hasMore && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <button 
              className="btn-secondary" 
              onClick={loadMore}
              disabled={loading}
              style={{ borderRadius: 20, padding: '10px 32px' }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
