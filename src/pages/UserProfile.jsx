import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, UserPlus, ArrowLeft, BookOpen, Microscope, Globe, ThumbsUp, MessageSquare, Share2, Bookmark, Calendar, Database, Newspaper, HelpCircle, Award, FileText, Tag, Repeat2, ExternalLink, X } from 'lucide-react';
import ChatBox from '../components/ChatBox';

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

const CATEGORY_CONFIG = {
  general: { label: 'Update', color: '#378fe9', bg: '#e0f2fe', icon: FileText },
  paper: { label: 'Paper', color: '#10b981', bg: '#d1fae5', icon: BookOpen },
  dataset: { label: 'Dataset', color: '#8b5cf6', bg: '#ede9fe', icon: Database },
  question: { label: 'Question', color: '#f59e0b', bg: '#fef3c7', icon: HelpCircle },
  milestone: { label: 'Milestone', color: '#ef4444', bg: '#fee2e2', icon: Award },
  event: { label: 'Event', color: '#ec4899', bg: '#fce7f3', icon: Calendar },
  article: { label: 'Article', color: '#e06847', bg: '#fff7ed', icon: Newspaper },
};

function CategoryCard({ item }) {
  const cat = item.category;
  if (cat === 'paper' && item.paper?.title) {
    return (
      <div className="post-attachment" style={{ borderLeft: '3px solid #10b981' }}>
        <div className="post-attachment-header">
          <span className="attachment-title"><BookOpen size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{item.paper.title}</span>
          <span className="attachment-type" style={{ background: '#d1fae5', color: '#10b981' }}>Paper</span>
        </div>
        <div className="post-attachment-body">
          {item.paper.journal && <div><strong>Journal:</strong> {item.paper.journal} {item.paper.year && `(${item.paper.year})`}</div>}
          {item.paper.doi && <div style={{ marginTop: 4 }}><strong>DOI:</strong> <a href={`https://doi.org/${item.paper.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>{item.paper.doi}</a></div>}
          {item.paper.coAuthors?.length > 0 && <div style={{ marginTop: 4 }}><strong>Co-authors:</strong> {item.paper.coAuthors.join(', ')}</div>}
        </div>
      </div>
    );
  }
  if (cat === 'dataset' && item.dataset?.title) {
    return (
      <div className="post-attachment" style={{ borderLeft: '3px solid #8b5cf6' }}>
        <div className="post-attachment-header">
          <span className="attachment-title"><Database size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{item.dataset.title}</span>
          <span className="attachment-type" style={{ background: '#ede9fe', color: '#8b5cf6' }}>Dataset</span>
        </div>
        <div className="post-attachment-body">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {item.dataset.source && <span>📦 {item.dataset.source}</span>}
            {item.dataset.size && <span>📊 {item.dataset.size}</span>}
            {item.dataset.format && <span>📄 {item.dataset.format}</span>}
          </div>
          {item.dataset.url && <div style={{ marginTop: 6 }}><a href={item.dataset.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> View Dataset</a></div>}
        </div>
      </div>
    );
  }
  if (cat === 'event' && item.event?.title) {
    return (
      <div className="post-attachment" style={{ borderLeft: '3px solid #ec4899' }}>
        <div className="post-attachment-header">
          <span className="attachment-title"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{item.event.title}</span>
          <span className="attachment-type" style={{ background: '#fce7f3', color: '#ec4899' }}>{item.event.eventType || 'Event'}</span>
        </div>
        <div className="post-attachment-body">
          {item.event.date && <span>📅 {new Date(item.event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          {item.event.location && <span style={{ marginLeft: 16 }}>📍 {item.event.location}</span>}
        </div>
      </div>
    );
  }
  if (cat === 'article' && item.article?.title) {
    return (
      <div className="post-attachment" style={{ borderLeft: '3px solid #e06847' }}>
        <div className="post-attachment-header">
          <span className="attachment-title"><Newspaper size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{item.article.title}</span>
          <span className="attachment-type" style={{ background: '#fff7ed', color: '#e06847' }}>Article</span>
        </div>
        {item.article.subtitle && <div className="post-attachment-body">{item.article.subtitle}</div>}
      </div>
    );
  }
  if (item.attachment?.title) {
    return (
      <div className="post-attachment">
        <div className="post-attachment-header">
          <span className="attachment-title">{item.attachment.title}</span>
          <span className="attachment-type">{item.attachment.type}</span>
        </div>
        <div className="post-attachment-body">{item.attachment.desc}</div>
      </div>
    );
  }
  return null;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [topicText, setTopicText] = useState('');

  const sendRequest = async () => {
    try {
      await api.post('/api/collaborations', {
        recipientId: userId,
        message: msgText,
        topic: topicText,
      });
      setRequestModal(false);
      setMsgText('');
      setTopicText('');
      alert('Collaboration request sent successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request.');
    }
  };

  const isOwnProfile = currentUser?._id === userId || currentUser?.id === userId;

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/api/profile/${userId}`),
          api.get(`/api/posts/user/${userId}`)
        ]);
        setProfile(profileRes.data);
        const postsData = postsRes.data.posts || postsRes.data;
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (err) {
        console.error(err);
        setError('Could not load this profile.');
      }
      setLoading(false);
    };
    fetchUserData();
  }, [userId, isOwnProfile, navigate]);

  if (loading) return <div className="loading-state"><p>Loading profile...</p></div>;
  if (error) return (
    <div className="loading-state">
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
      <button className="btn-primary" onClick={() => navigate(-1)} style={{ borderRadius: 20 }}>
        <ArrowLeft size={16} style={{ marginRight: 6 }} /> Go Back
      </button>
    </div>
  );

  const displayName = profile?.name || 'Researcher';

  return (
    <div className="profile-view">
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Feed
        </button>
      </div>

      <div className="profile-core">
        <div>
          {/* Profile Card */}
          <div className="card profile-top-card">
            <div className="profile-banner"></div>
            <div className="profile-main-avatar">{displayName.charAt(0)}</div>
            <div className="profile-info">
              <h1 className="profile-name">{displayName} <CheckCircle className="badge-verified" /></h1>
              <div className="profile-headline">{profile?.title || 'Researcher'}</div>
              <div className="profile-location">
                {profile?.institution || 'Research Institute'} • 
                <span className="profile-connections" style={{ marginLeft: 6 }}>500+ Collaborators</span>
              </div>

              <div className="profile-metrics-ribbon">
                <div className="metric-block">
                  <span className="metric-val">{profile?.stats?.hIndex || 0}</span>
                  <span className="metric-lbl">H-Index</span>
                </div>
                <div className="metric-block">
                  <span className="metric-val">{profile?.stats?.interest || 0}</span>
                  <span className="metric-lbl">Interest Score</span>
                </div>
                <div className="metric-block">
                  <span className="metric-val">{profile?.stats?.citations?.toLocaleString() || 0}</span>
                  <span className="metric-lbl">Total Citations</span>
                </div>
                <div className="metric-block">
                  <span className="metric-val">{posts.length}</span>
                  <span className="metric-lbl">Posts</span>
                </div>
              </div>

              <div className="profile-actions">
                <button className="btn-primary" onClick={() => setRequestModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserPlus size={16} /> Request Collaboration</button>
                <button className="btn-secondary" onClick={() => setShowChat(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={16} /> Message
                </button>
              </div>
            </div>
          </div>

          {/* About section */}
          {profile?.about && (
            <div className="card profile-section">
              <h2 className="section-title">About</h2>
              <div className="about-text">{profile.about}</div>
            </div>
          )}

          {/* Grants */}
          {profile?.grants?.length > 0 && (
            <div className="card profile-section">
              <h2 className="section-title"><Microscope size={18} /> Grants & Funding</h2>
              {profile.grants.map((grant, i) => (
                <div key={i} className="item-card" style={{ marginBottom: 16, paddingBottom: 16 }}>
                  <div className="item-icon" style={{ background: 'var(--accent-light)' }}><Microscope /></div>
                  <div className="item-content">
                    <h3 style={{ marginBottom: 4 }}>{grant.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{grant.agency} • {grant.amount} • {grant.period}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Publications */}
          {profile?.publications?.length > 0 && (
            <div className="card profile-section">
              <h2 className="section-title"><BookOpen size={18} /> Publications</h2>
              {profile.publications.map((pub, i) => (
                <div key={i} className="item-card">
                  <div className="item-icon"><BookOpen /></div>
                  <div className="item-content">
                    <h3>{pub.title}</h3>
                    <div className="item-meta">{pub.journal} • {pub.date ? new Date(pub.date).getFullYear() : '2026'} • Citations: {pub.citations}</div>
                    {pub.abstract && <div className="item-description">{pub.abstract}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: User's posts */}
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Activity</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          </div>

          {posts.length === 0 ? (
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>This user hasn't posted anything yet.</p>
            </div>
          ) : (
            posts.map(item => {
              const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
              return (
                <div key={item._id || item.id} className="card feed-post" style={{ marginBottom: 12 }}>
                  {item.isRepost && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <Repeat2 size={14} /> Shared a post
                    </div>
                  )}
                  <div className="post-header">
                    <div className="share-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>{displayName.charAt(0)}</div>
                    <div className="post-author-info">
                      <div className="post-author-name" style={{ fontSize: 14 }}>{displayName}</div>
                      <div className="post-author-headline" style={{ fontSize: 12 }}>{item.action}{item.target ? ` • ${item.target}` : ''}</div>
                      <div className="post-time" style={{ fontSize: 11 }}>{timeAgo(item.createdAt)} • <Globe size={10} /></div>
                    </div>
                  </div>

                  <div className="post-body" style={{ fontSize: 14 }}>{item.content}</div>

                  {item.category && item.category !== 'general' && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600, background: catConfig.bg, color: catConfig.color,
                      }}>
                        {React.createElement(catConfig.icon, { size: 11 })} {catConfig.label}
                      </span>
                    </div>
                  )}

                  <CategoryCard item={item} />

                  {item.isRepost && item.originalPost && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, margin: '0 0 8px', background: '#fafbfc' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <div className="share-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{item.originalPost.author?.name?.charAt(0) || 'U'}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.originalPost.author?.name || 'Researcher'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{timeAgo(item.originalPost.createdAt)}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13 }}>{item.originalPost.content}</div>
                    </div>
                  )}

                  <div className="post-stats" style={{ fontSize: 12 }}>
                    <span><ThumbsUp size={12} color="var(--accent-color)" style={{ verticalAlign: 'middle', marginRight: 3 }} /> {item.likes}</span>
                    <span>{item.comments} comments • {item.shares || 0} shares</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Chat Box */}
      {showChat && (
        <ChatBox
          recipientId={userId}
          recipientName={displayName}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Collaboration Request Modal */}
      {requestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Send Collaboration Request</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setRequestModal(false); setMsgText(''); setTopicText(''); }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Research Topic</label>
              <input
                type="text"
                placeholder="e.g. Quantum Computing, ML for Biology..."
                value={topicText}
                onChange={e => setTopicText(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Message (optional)</label>
              <textarea
                placeholder="Introduce yourself and explain why you'd like to collaborate..."
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setRequestModal(false); setMsgText(''); setTopicText(''); }}>Cancel</button>
              <button className="btn-primary" onClick={sendRequest} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
