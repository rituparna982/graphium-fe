import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Microscope, Database, Calendar, TrendingUp, ThumbsUp, MessageSquare, Bookmark, Quote, Globe, FileText, CheckCircle, Edit, Library, Clock, PenSquare, Share2, BookOpen, HelpCircle, Award, Newspaper, ExternalLink, Tag, Repeat2, Send, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import PostModal from '../components/PostModal';
import QuickShareModal from '../components/QuickShareModal';

// Helper: format timestamps as relative time ("2 mins ago", "3 hours ago", etc.)
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

// Category badge colors and icons
const CATEGORY_CONFIG = {
  general: { label: 'Update', color: '#378fe9', bg: '#e0f2fe', icon: FileText },
  paper: { label: 'Paper', color: '#10b981', bg: '#d1fae5', icon: BookOpen },
  dataset: { label: 'Dataset', color: '#8b5cf6', bg: '#ede9fe', icon: Database },
  question: { label: 'Question', color: '#f59e0b', bg: '#fef3c7', icon: HelpCircle },
  milestone: { label: 'Milestone', color: '#ef4444', bg: '#fee2e2', icon: Award },
  event: { label: 'Event', color: '#ec4899', bg: '#fce7f3', icon: Calendar },
  article: { label: 'Article', color: '#e06847', bg: '#fff7ed', icon: Newspaper },
};

// Render category-specific card inside a post
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
            {item.dataset.license && <span>⚖️ {item.dataset.license}</span>}
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
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {item.event.date && <span>📅 {new Date(item.event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
            {item.event.location && <span>📍 {item.event.location}</span>}
          </div>
          {item.event.url && <div style={{ marginTop: 6 }}><a href={item.event.url} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Event Page</a></div>}
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
        {(item.article.subtitle || item.article.url) && (
          <div className="post-attachment-body">
            {item.article.subtitle && <div>{item.article.subtitle}</div>}
            {item.article.url && <div style={{ marginTop: 4 }}><a href={item.article.url} target="_blank" rel="noopener noreferrer" style={{ color: '#e06847', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ExternalLink size={12} /> Read More</a></div>}
          </div>
        )}
      </div>
    );
  }

  // Fallback: generic attachment from older posts
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

// Renders a single post card's content (used for both original and repost display)
function PostContent({ item }) {
  const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;

  return (
    <>
      {item.content && <div className="post-body">{item.content}</div>}
      
      {/* Photo Gallery */}
      {item.photos?.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: item.photos.length === 1 ? '1fr' : '1fr 1fr', 
          gap: 4, 
          margin: '12px 0',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          {item.photos.map((photo, i) => (
            <img 
              key={i} 
              src={photo} 
              alt="Post" 
              style={{ 
                width: '100%', 
                height: item.photos.length > 2 ? 150 : 300, 
                objectFit: 'cover',
                cursor: 'pointer'
              }} 
              onClick={() => window.open(photo, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Category badge */}
      {item.category && item.category !== 'general' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            background: catConfig.bg,
            color: catConfig.color,
          }}>
            {React.createElement(catConfig.icon, { size: 12 })}
            {catConfig.label}
          </span>
          {item.tags?.length > 0 && item.tags.map((tag, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, background: '#f1f5f9', color: 'var(--text-secondary)' }}>
              <Tag size={10} />{tag}
            </span>
          ))}
        </div>
      )}

      <CategoryCard item={item} />
      
      {/* AI Summary Section */}
      {item.aiSummary && (
        <div style={{
          marginTop: 16,
          padding: 16,
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          borderRadius: 12,
          border: '1px solid #ddd6fe',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#7c3aed', fontWeight: 700, fontSize: 13 }}>
            <Sparkles size={16} /> AI Research Insights
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#4c1d95', fontWeight: 500 }}>
            {item.aiSummary}
          </div>
          <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}>
            <Sparkles size={64} color="#7c3aed" />
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [feed, setFeed] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savedSet, setSavedSet] = useState(new Set(user?.savedPosts || []));
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentsCache, setCommentsCache] = useState({});
  const [newComment, setNewComment] = useState('');
  
  const [sendPostId, setSendPostId] = useState(null);
  const [sendUserSearch, setSendUserSearch] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [summarizingIds, setSummarizingIds] = useState(new Set());
  
  // PDF Summarizer Studio
  const [pdfSummarizing, setPdfSummarizing] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const pdfInputRef = React.useRef(null);

  const fetchData = async () => {
    try {
      const [feedRes, profileRes] = await Promise.all([
        api.get('/api/posts'),
        api.get('/api/profile').catch(() => ({ data: null }))
      ]);
      // Backend now returns { posts, pagination } — extract the posts array
      const postsData = feedRes.data.posts || feedRes.data;
      setFeed(Array.isArray(postsData) ? postsData : []);
      setProfile(profileRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/like`);
      setFeed(feed.map(p => (p._id || p.id) === postId ? {
         ...p, 
         likes: res.data.likes,
         likedBy: res.data.isLiked ? [...(p.likedBy || []), user?._id] : (p.likedBy || []).filter(id => id !== user?._id)
      } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSave = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/save`);
      setSavedSet(prev => {
        const newSet = new Set(prev);
        if (res.data.isSaved) newSet.add(postId);
        else newSet.delete(postId);
        return newSet;
      });
    } catch(err) {
      console.error(err);
    }
  };

  const sharePost = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/share`, { content: '' });
      if (res.data) {
        setFeed(prev => [res.data, ...prev]);
        // Also update share count on the original post in the feed
        setFeed(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, shares: (p.shares || 0) + 1 } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (postId) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      if (!commentsCache[postId]) {
        try {
          const res = await api.get(`/api/posts/${postId}/comments`);
          setCommentsCache(prev => ({...prev, [postId]: res.data}));
        } catch(err) {
          console.error(err);
        }
      }
    }
  };

  const submitComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/api/posts/${postId}/comment`, { content: newComment });
      setCommentsCache(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setFeed(feed.map(p => (p._id || p.id) === postId ? { ...p, comments: p.comments + 1 } : p));
      setNewComment('');
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Optionally fetch friends/users if we wanted
    api.get('/api/communities').then(res => {
      if(Array.isArray(res.data)) setUsersList(res.data);
    }).catch(() => {});
  }, []);

  const sendPostMessage = async (targetUserId) => {
    if (!sendPostId || !targetUserId) return;
    try {
      await api.post(`/api/messages/${targetUserId}`, { 
        content: `I shared a post with you! Check out my updates on the home page.` 
      });
      setSendPostId(null);
      alert('Post shared via message successfully!');
    } catch(err) {
      console.error(err);
      alert('Error sending message');
    }
  };

  const handleSummarize = async (postId) => {
    if (summarizingIds.has(postId)) return;
    
    setSummarizingIds(prev => new Set(prev).add(postId));
    try {
      const res = await api.post(`/api/posts/${postId}/summarize`);
      if (res.data.aiSummary) {
        setFeed(prev => prev.map(p => (p._id || p.id) === postId ? { ...p, aiSummary: res.data.aiSummary } : p));
      }
    } catch (err) {
      console.error('[AI] Summarize failed:', err);
      alert('AI Summarization failed. Please ensure the API is configured correctly.');
    }
    setSummarizingIds(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setPdfResult(null);
    setPdfSummarizing(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post('/api/posts/summarize-pdf', { pdfData: reader.result });
        setPdfResult(res.data.summary);
      } catch (err) {
        console.error('[AI STUDIO] PDF Error:', err);
        alert('AI was unable to process this PDF. Ensure it is not password protected.');
      } finally {
        setPdfSummarizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCommentLike = async (postId, commentId) => {
    try {
      const res = await api.post(`/api/posts/comment/${commentId}/like`);
      setCommentsCache(prev => {
        const postComments = prev[postId] || [];
        return {
          ...prev,
          [postId]: postComments.map(c => 
            c._id === commentId 
              ? { 
                  ...c, 
                  likes: res.data.likes, 
                  likedBy: res.data.isLiked 
                    ? [...(c.likedBy || []), user?._id] 
                    : (c.likedBy || []).filter(id => id !== user?._id) 
                }
              : c
          )
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-state"><p>Loading feed...</p></div>;

  return (
    <div className="core-rail">
      {/* Left Column */}
      <div>
        {/* AI Research Studio Widget */}
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden', border: '1px solid #ddd6fe' }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', padding: '16px', color: 'white' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} /> AI Research Studio
            </h3>
            <p style={{ fontSize: 11, margin: '8px 0 0', opacity: 0.9 }}>Summarize any PDF paper instantly</p>
          </div>
          
          <div style={{ padding: 16 }}>
            {!pdfResult && !pdfSummarizing ? (
              <div 
                onClick={() => pdfInputRef.current?.click()}
                style={{
                  border: '2px dashed #ddd6fe',
                  borderRadius: 12,
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <BookOpen size={32} color="#7c3aed" style={{ marginBottom: 12, opacity: 0.6 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95' }}>Upload PDF Paper</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Gemini 1.5 Flash Doc AI</div>
                <input type="file" accept=".pdf" ref={pdfInputRef} style={{ display: 'none' }} onChange={handlePdfUpload} />
              </div>
            ) : pdfSummarizing ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Loader2 size={32} className="animate-spin" color="#7c3aed" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>AI is Reading Paper...</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Extracting core insights...</div>
              </div>
            ) : (
              <div>
                <div style={{ background: '#f5f3ff', borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.6, color: '#4c1d95', maxHeight: 300, overflowY: 'auto' }}>
                  {pdfResult}
                </div>
                <button 
                  onClick={() => { setPdfResult(null); }}
                  style={{ width: '100%', marginTop: 12, padding: '8px', borderRadius: 8, background: '#ede9fe', color: '#7c3aed', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                >
                  Clear & Process New
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card mini-profile-card">
          <div 
            className="mini-profile-header" 
            onClick={() => navigate('/profile')}
            style={{ 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="mini-profile-bg"></div>
            <div className="mini-profile-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="mini-profile-name" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>
              {user?.name || 'Researcher'}
            </div>
            <div className="mini-profile-title">{profile?.title || 'Researcher'}</div>
          </div>
          
          <div className="mini-profile-stats" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div className="stat-row"><span>H-Index</span><span className="stat-value">{profile?.stats?.hIndex || 0}</span></div>
            <div className="stat-row"><span>Total Citations</span><span className="stat-value">{profile?.stats?.citations?.toLocaleString() || 0}</span></div>
          </div>
          <div 
            className="stat-row" 
            onClick={() => navigate('/profile')}
            style={{ 
              padding: '12px 16px', 
              justifyContent: 'flex-start', 
              gap: 8, 
              borderTop: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
          >
             <Library size={18} /> My Library
          </div>
        </div>

        <div className="card widget-card" style={{ padding: 16 }}>
          <div className="widget-title">Active Projects</div>
          <div className="widget-item">
             <div className="widget-item-icon"><Microscope size={18} /></div>
             <div className="widget-item-text"><strong>Q-Sim Lab</strong> 12 collaborators</div>
          </div>
          <div className="widget-item">
             <div className="widget-item-icon"><Database size={18} /></div>
             <div className="widget-item-text"><strong>Material Dataset</strong> Open Source</div>
          </div>
        </div>

        <div className="card news-widget" style={{ marginTop: 16 }}>
          <h2 className="news-header"><Calendar size={18} /> Upcoming Deadlines</h2>
          <ul className="news-list">
            <li className="news-item">
              <div className="news-title">NSF Quantum Leap Challenge Institute <span className="grant-badge">Grant</span></div>
              <div className="news-meta">Due in 14 days • $5M funding available</div>
            </li>
            <li className="news-item">
              <div className="news-title">NeurIPS 2026 Paper Submission</div>
              <div className="news-meta">Due in 28 days • 12,492 interested</div>
            </li>
          </ul>
        </div>
        <div className="card news-widget">
          <h2 className="news-header"><TrendingUp size={18} color="#10b981" /> Trending Papers</h2>
          <ul className="news-list">
            <li className="news-item">
              <div className="news-title">Room-temperature superconductivity in carbonaceous sulfur...</div>
              <div className="news-meta">Nature • 142 recommendations</div>
            </li>
            <li className="news-item">
              <div className="news-title">Transformers scale to 10 Trillion parameters</div>
              <div className="news-meta">ArXiv • 8,921 readers</div>
            </li>
          </ul>
        </div>
      </div>

      {/* Center Column */}
      <div>
        <div className="card share-box share-box-v2">
          <div className="share-bar">
            <Link to="/profile" className="share-avatar" style={{ width: 48, height: 48, fontSize: 20, textDecoration: 'none', cursor: 'pointer' }}>
              {user?.name?.charAt(0) || 'U'}
            </Link>
            <button className="share-trigger" onClick={() => setIsModalOpen(true)}>
              Start a post
            </button>
          </div>
          <div className="share-actions-v2">
            <div className="share-action-item" onClick={() => setIsModalOpen(true)}>
              <BookOpen size={20} color="#10b981" />
              <span>Paper</span>
            </div>
            <div className="share-action-item" onClick={() => setIsModalOpen(true)}>
              <Database size={20} color="#8b5cf6" />
              <span>Dataset</span>
            </div>
            <div className="share-action-item" onClick={() => setIsModalOpen(true)}>
              <Calendar size={20} color="#ec4899" />
              <span>Event</span>
            </div>
            <div className="share-action-item" onClick={() => setIsModalOpen(true)}>
              <ImageIcon size={20} color="#3b82f6" />
              <span>Image</span>
            </div>
            <div className="share-action-item" onClick={() => setIsShareModalOpen(true)}>
              <Send size={20} color="#f59e0b" />
              <span>Choose & Share Image</span>
            </div>
            <div className="share-action-item" onClick={() => setIsModalOpen(true)}>
              <Newspaper size={20} color="#e06847" />
              <span>Article</span>
            </div>
            <div className="share-action-item" onClick={() => pdfInputRef.current?.click()} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8 }}>
              <Sparkles size={20} color="#7c3aed" />
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>AI Summarize PDF</span>
            </div>
          </div>
        </div>

        <QuickShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          user={user} 
        />

        <PostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          user={user}
          profile={profile}
          onPostSuccess={(newPost) => {
            if (newPost) {
              setFeed(prev => [newPost, ...prev]);
            }
            fetchData();
          }}
        />
        {/* Sort label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 4 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Clock size={12} /> Most Recent
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
        </div>

        <div className="feed-container">
          {feed.length === 0 && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <PenSquare size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No posts yet</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto 20px' }}>
                Be the first to share a research update, paper, or insight with the community!
              </p>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ borderRadius: 24, padding: '10px 24px' }}>
                Create your first post
              </button>
            </div>
          )}
          {feed.map(item => (
            <div key={item._id || item.id} className="card feed-post interactive">
              {/* Repost indicator */}
              {item.isRepost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <Repeat2 size={14} /> {item.author?.name || 'Someone'} shared this
                </div>
              )}

              <div className="post-header">
                <Link to={`/user/${item.author?._id || item.author?.id}`} style={{ textDecoration: 'none' }}>
                  <div className="share-avatar" style={{width: 48, height: 48, fontSize: 20, cursor: 'pointer'}}>{item.author?.name?.charAt(0) || 'U'}</div>
                </Link>
                <div className="post-author-info">
                  <Link to={`/user/${item.author?._id || item.author?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="post-author-name">{item.author?.name || 'Unknown Researcher'}</div>
                  </Link>
                  <div className="post-author-headline">{item.action}{item.target ? ` • ${item.target}` : ''}</div>
                  <div className="post-time">{timeAgo(item.createdAt)} • <Globe size={12} /></div>
                </div>
              </div>

              {/* Post content or reposted original */}
              {item.isRepost && item.originalPost ? (
                <>
                  {item.content && <div className="post-body" style={{ marginBottom: 12 }}>{item.content}</div>}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, margin: '0 0 12px', background: '#fafbfc' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Link to={`/user/${item.originalPost.author?._id || item.originalPost.author?.id}`} style={{ textDecoration: 'none' }}>
                        <div className="share-avatar" style={{ width: 36, height: 36, fontSize: 14, cursor: 'pointer' }}>{item.originalPost.author?.name?.charAt(0) || 'U'}</div>
                      </Link>
                      <div>
                        <Link to={`/user/${item.originalPost.author?._id || item.originalPost.author?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{item.originalPost.author?.name || 'Researcher'}</div>
                        </Link>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{timeAgo(item.originalPost.createdAt)}</div>
                      </div>
                    </div>
                    <PostContent item={item.originalPost} />
                  </div>
                </>
              ) : (
                <PostContent item={item} />
              )}

              <div className="post-stats">
                <span><ThumbsUp size={14} color="var(--accent-color)" style={{ verticalAlign: 'middle', marginRight: 4 }} /> {item.likes}</span>
                <span>{item.comments} comments • {item.shares || 0} shares</span>
              </div>
              <div className="post-actions">
                <button 
                  className="post-action-btn" 
                  onClick={() => toggleLike(item._id || item.id)}
                  style={{ color: item.likedBy?.includes(user?._id) ? 'var(--accent-color)' : 'inherit' }}
                >
                  <ThumbsUp size={18}/> {item.likedBy?.includes(user?._id) ? 'Liked' : 'Like'}
                </button>
                <button 
                  className="post-action-btn"
                  onClick={() => toggleComments(item._id || item.id)}
                >
                  <MessageSquare size={18}/> Comment
                </button>
                <button 
                  className="post-action-btn"
                  onClick={() => sharePost(item._id || item.id)}
                >
                  <Share2 size={18}/> Share
                </button>
                <button 
                  className="post-action-btn"
                  onClick={() => setSendPostId(item._id || item.id)}
                >
                  <Send size={18}/> Send
                </button>
                {(item.content?.length > 100 || item.paper || item.article) && !item.aiSummary && (
                  <button 
                    className="post-action-btn"
                    onClick={() => handleSummarize(item._id || item.id)}
                    disabled={summarizingIds.has(item._id || item.id)}
                    style={{ color: '#7c3aed', fontWeight: 600 }}
                  >
                    {summarizingIds.has(item._id || item.id) ? (
                      <><Loader2 size={18} className="animate-spin" style={{ marginRight: 6 }} /> AI Reading...</>
                    ) : (
                      <><Sparkles size={18} style={{ marginRight: 6 }} /> AI Summarize</>
                    )}
                  </button>
                )}
                <button 
                  className="post-action-btn"
                  onClick={() => toggleSave(item._id || item.id)}
                  style={{ color: savedSet.has(item._id || item.id) ? 'var(--accent-color)' : 'inherit' }}
                >
                  <Bookmark size={18}/> {savedSet.has(item._id || item.id) ? 'Saved' : 'Save'}
                </button>
              </div>

              {activeCommentPost === (item._id || item.id) && (
                <div className="comments-section" style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div className="share-avatar" style={{width: 32, height: 32, fontSize: 14, flexShrink: 0}}>{user?.name?.charAt(0) || 'U'}</div>
                    <div style={{ display: 'flex', flex: 1, gap: 8 }}>
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..." 
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitComment(item._id || item.id); }}
                      />
                      <button className="btn-primary" onClick={() => submitComment(item._id || item.id)} style={{ borderRadius: 20, padding: '0 16px' }}>Post</button>
                    </div>
                  </div>
                  
                  <div className="comments-list">
                    {(commentsCache[item._id || item.id] || []).map(comment => (
                      <div key={comment._id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <div className="share-avatar" style={{width: 32, height: 32, fontSize: 14, flexShrink: 0}}>{comment.author?.name?.charAt(0) || 'U'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{comment.author?.name || 'User'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{comment.content}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4, marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
                            <span 
                              style={{ cursor: 'pointer', fontWeight: 600, color: comment.likedBy?.includes(user?._id) ? 'var(--accent-color)' : 'inherit' }}
                              onClick={() => toggleCommentLike(item._id || item.id, comment._id)}
                            >
                              Like
                            </span>
                            {comment.likes > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ThumbsUp size={12} color="var(--accent-color)" /> {comment.likes}
                              </span>
                            )}
                            <span style={{ color: 'var(--text-tertiary)' }}>
                               {timeAgo(comment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {sendPostId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Send in Message</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSendPostId(null)} />
            </div>
            <input 
              type="text" 
              placeholder="Search user..." 
              value={sendUserSearch}
              onChange={(e) => setSendUserSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 16 }}
            />
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {usersList.filter(u => u.name?.toLowerCase().includes(sendUserSearch.toLowerCase())).map(u => (
                <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="share-avatar" style={{width: 32, height: 32}}>{u.name?.charAt(0) || 'U'}</div>
                  <div style={{ flex: 1, fontWeight: 500 }}>{u.name}</div>
                  <button className="btn-primary" onClick={() => sendPostMessage(u._id || u.id)} style={{ padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>Send</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

