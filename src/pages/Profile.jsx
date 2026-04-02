import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, UserPlus, User, Microscope, BookOpen, Download, PenSquare, 
  Settings, Clock, Shield, Bell, Eye, Moon, Globe, ChevronRight, 
  Mail, Key, Activity, HelpCircle, LogOut, Edit3, Save, X
} from 'lucide-react';
import PostModal from '../components/PostModal';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'settings'
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [follows, setFollows] = useState(0);

  useEffect(() => {
    api.get('/api/profile').then(res => {
      setProfile(res.data);
      setFollows(res.data.collaboratorCount || 0);
    }).catch(err => console.error('[PROFILE] Load error:', err));

    api.get(`/api/posts/user/${user?._id || user?.id}`)
      .then(res => setPosts(res.data.posts || res.data))
      .catch(err => console.error('[PROFILE] Posts load error:', err));
  }, [user]);

  const handleScholarSync = async () => {
    const authorId = window.prompt("Enter your Google Scholar Author ID (e.g., LSf_mNcAAAAJ):");
    if (!authorId) return;

    try {
      const res = await api.get(`/api/scholar/author/${authorId}`);
      const scholarData = res.data.author;
      
      if (scholarData) {
        const updated = {
          ...profile,
          stats: {
            ...profile.stats,
            hIndex: scholarData.stats?.h_index || profile.stats.hIndex,
            citations: scholarData.stats?.citations || profile.stats.citations,
          },
          institution: scholarData.affiliations || profile.institution
        };
        
        await api.put('/api/profile', updated);
        setProfile(updated);
        alert("Profile synced with Google Scholar!");
      }
    } catch (err) {
      alert("Sync failed. Ensure Author ID is correct and SERPAPI_KEY is configured.");
    }
  };

  const startEdit = () => {
    setEditFields({
      title: profile?.title || '',
      institution: profile?.institution || '',
      about: profile?.about || '',
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/profile', { ...profile, ...editFields });
      setProfile(res.data);
      setEditMode(false);
    } catch (err) {
      console.error('[PROFILE] Save error:', err);
      alert('Failed to save profile.');
    }
    setSaving(false);
  };

  if (!profile) return <div className="loading-state">Loading...</div>;

  const settingsGroups = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Email', value: user?.email || 'Not set', icon: Mail },
        { label: 'User ID', value: user?._id?.substring(0, 12) + '...' || 'Unknown', icon: Key },
        { label: 'Account Type', value: user?.role || 'researcher', icon: Shield },
        { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown', icon: Clock },
      ]
    },
    {
      title: 'Activity',
      icon: Activity,
      items: [
        { label: 'Activity History', value: 'View all actions', icon: Clock, link: '/history' },
        { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Now', icon: LogOut },
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        { label: 'Visibility', value: 'Public', icon: Eye },
        { label: 'Notifications', value: 'Enabled', icon: Bell },
        { label: 'Theme', value: 'System Default', icon: Moon },
        { label: 'Language', value: 'English', icon: Globe },
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        { label: 'Help Center', value: 'Get support', icon: HelpCircle },
        { label: 'Privacy Policy', value: 'View', icon: Shield },
      ]
    },
  ];

  return (
    <div className="profile-view">
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        profile={profile}
        onPostSuccess={() => setIsModalOpen(false)}
      />
      <button
        onClick={() => setIsModalOpen(true)}
        style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
        className="btn-primary"
        title="Create a post"
      >
        <PenSquare size={22} />
      </button>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ 
            padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer',
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent-color)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--accent-color)' : 'var(--text-secondary)',
            marginBottom: -2,
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <User size={16} /> Profile
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ 
            padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer',
            background: 'none', border: 'none', 
            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-color)' : '2px solid transparent',
            color: activeTab === 'settings' ? 'var(--accent-color)' : 'var(--text-secondary)',
            marginBottom: -2,
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Settings size={16} /> Settings
        </button>
      </div>

      {activeTab === 'profile' ? (
        /* ── PROFILE TAB ── */
        <div className="profile-core">
          <div>
            <div className="card profile-top-card">
              <div className="profile-banner"></div>
              <div className="profile-main-avatar">{profile.name?.charAt(0) || 'U'}</div>
              <div className="profile-info">
                {editMode ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Title</label>
                        <input 
                          value={editFields.title} 
                          onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
                          placeholder="Your title (e.g. Senior Researcher)"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Institution</label>
                        <input 
                          value={editFields.institution} 
                          onChange={e => setEditFields(f => ({ ...f, institution: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
                          placeholder="Your institution"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>About</label>
                        <textarea 
                          value={editFields.about} 
                          onChange={e => setEditFields(f => ({ ...f, about: e.target.value }))}
                          rows={3}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                          placeholder="Tell us about your research..."
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" onClick={saveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn-secondary" onClick={() => setEditMode(false)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="profile-name">{profile.name} {user?.isVerified && <CheckCircle className="badge-verified" style={{ color: '#059669' }} />}</h1>
                    <div className="profile-headline">{profile.title}</div>
                  <div className="profile-location">{profile.institution || 'Research Institute'} • <span className="profile-connections">{follows} Connections</span></div>
                </>
              )}
              
              <div className="profile-metrics-ribbon">
                 <div className="metric-block">
                   <span className="metric-val">{profile.stats?.hIndex || 0}</span>
                   <span className="metric-lbl">H-Index</span>
                 </div>
                 <div className="metric-block">
                   <span className="metric-val">{profile.stats?.interest || 0}</span>
                   <span className="metric-lbl">Interest Score</span>
                 </div>
                 <div className="metric-block">
                   <span className="metric-val">{profile.stats?.citations?.toLocaleString() || 0}</span>
                   <span className="metric-lbl">Total Citations</span>
                 </div>
              </div>

              <div className="profile-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setFollows(f => f + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <UserPlus size={16} /> Follow
                </button>
                {!editMode && (
                  <button className="btn-secondary" onClick={startEdit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Edit3 size={14} /> Edit Profile
                  </button>
                )}
                <button className="btn-secondary" onClick={handleScholarSync}>Sync with Scholar</button>
                <Link to="/messaging" style={{ textDecoration: 'none' }}>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} /> Messages
                  </button>
                </Link>
              </div>
              </div>
            </div>
            <div className="card profile-section">
              <h2 className="section-title"><User /> About</h2>
              <div className="about-text">{profile.about || 'No bio yet. Click Edit Profile to add one.'}</div>
            </div>
            <div className="card profile-section">
              <h2 className="section-title"><Microscope /> Current Grants & Funding</h2>
              {profile.grants?.length > 0 ? profile.grants.map((grant, i) => (
                <div key={i} className="item-card" style={{ marginBottom: 16, paddingBottom: 16 }}>
                  <div className="item-icon" style={{ background: 'var(--accent-light)' }}><Microscope /></div>
                  <div className="item-content">
                    <h3 style={{ marginBottom: 4 }}>{grant.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{grant.agency} • {grant.amount} • {grant.period}</p>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No grants listed yet.</p>
              )}
                 <div className="card profile-section">
              <h2 className="section-title"><PenSquare size={18} style={{ marginRight: 8, verticalAlign: -2 }} /> My Posts</h2>
              {posts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {posts.map(post => (
                    <div key={post._id} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 10, background: '#f8fafc' }}>
                       <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                       <p style={{ fontSize: 14, lineHeight: 1.5 }}>{post.content}</p>
                       {post.photos?.length > 0 && (
                          <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden' }}>
                            <img src={post.photos[0]} alt="Post" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                          </div>
                       )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>You haven't posted anything yet.</p>
              )}
            </div>
            </div>
            <div className="card profile-section">
              <h2 className="section-title"><BookOpen /> Notable Publications</h2>
              {profile.publications?.length > 0 ? profile.publications.map((pub, i) => (
                <div key={i} className="item-card">
                  <div className="item-icon"><BookOpen /></div>
                  <div className="item-content">
                    <h3>{pub.title}</h3>
                    <div className="item-meta">{pub.journal} • {pub.date ? new Date(pub.date).getFullYear() : '2026'} • Citations: {pub.citations}</div>
                    <div className="item-description">{pub.abstract}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                       <button className="btn-secondary" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, display: 'flex', alignItems:'center', gap: 4 }}><Download size={14} /> PDF</button>
                       <button className="btn-secondary" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12 }}>Cite</button>
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No publications listed yet.</p>
              )}
            </div>
          </div>
          <div>
            <div className="card profile-section" style={{ padding: 24 }}>
               <h2 className="section-title" style={{ fontSize: 16, marginBottom: 16 }}>Quick Actions</h2>
               <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8 }}>
                  <PenSquare size={16} /> Share an Update
               </button>
            </div>

            {/* Quick links */}
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Quick Links</h3>
              <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                <Clock size={16} color="var(--accent-color)" /> Activity History
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
              </Link>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                <Activity size={16} color="var(--accent-color)" /> Dashboard
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ── SETTINGS TAB ── */
        <div style={{ maxWidth: 700 }}>
          {settingsGroups.map((group, gi) => {
            const GroupIcon = group.icon;
            return (
              <div key={gi} className="card" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ 
                  fontSize: 15, fontWeight: 700, marginBottom: 16, 
                  display: 'flex', alignItems: 'center', gap: 8,
                  paddingBottom: 12, borderBottom: '1px solid var(--border-color)'
                }}>
                  <GroupIcon size={18} color="var(--accent-color)" /> {group.title}
                </h3>
                {group.items.map((item, ii) => {
                  const ItemIcon = item.icon;
                  const content = (
                    <div 
                      key={ii} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 14, 
                        padding: '14px 4px',
                        borderBottom: ii < group.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: item.link ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 8, 
                        background: '#f1f5f9', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ItemIcon size={16} color="var(--text-secondary)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.value}</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-tertiary)" />
                    </div>
                  );

                  if (item.link) {
                    return (
                      <Link key={ii} to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {content}
                      </Link>
                    );
                  }
                  return <div key={ii}>{content}</div>;
                })}
              </div>
            );
          })}

          {/* Logout button in settings */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <button 
              onClick={logout}
              style={{ 
                width: '100%', padding: '14px', borderRadius: 10, 
                border: '1px solid #fecaca', background: '#fff5f5', 
                color: '#ef4444', fontWeight: 600, fontSize: 15, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', gap: 8,
                transition: 'background 0.2s'
              }}
            >
              <LogOut size={18} /> Log Out
            </button>
          </div>

          {/* Dev mode notice */}
          <div style={{ 
            textAlign: 'center', padding: 16, fontSize: 12, 
            color: 'var(--text-tertiary)', fontStyle: 'italic' 
          }}>
            🔧 Development Mode — Some settings are display-only
          </div>
        </div>
      )}
    </div>
  );
}
