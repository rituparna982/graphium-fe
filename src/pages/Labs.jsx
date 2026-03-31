import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Microscope, Plus, Users, LogOut, Trash2, Megaphone, X, Award, ChevronDown, ChevronUp, PenSquare } from 'lucide-react';
import PostModal from '../components/PostModal';

export default function Labs() {
  const { user } = useAuth();
  const myId = user?._id || user?.id;

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLab, setNewLab] = useState({ name: '', description: '', researchFocus: '', tags: '' });
  const [announceModal, setAnnounceModal] = useState(null);
  const [announceText, setAnnounceText] = useState('');
  const [expandedLab, setExpandedLab] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLabs = () => {
    api.get('/api/labs').then(res => setLabs(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLabs(); }, []);

  const createLab = async () => {
    if (!newLab.name.trim()) return;
    try {
      const res = await api.post('/api/labs', {
        ...newLab,
        tags: newLab.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setLabs(prev => [res.data, ...prev]);
      setNewLab({ name: '', description: '', researchFocus: '', tags: '' });
      setShowCreate(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed to create lab.'); }
  };

  const joinLab = async (labId) => {
    try {
      const res = await api.post(`/api/labs/${labId}/join`);
      setLabs(prev => prev.map(l => l._id === labId ? res.data : l));
    } catch (err) { alert(err.response?.data?.error || 'Failed to join.'); }
  };

  const leaveLab = async (labId) => {
    try {
      await api.post(`/api/labs/${labId}/leave`);
      setLabs(prev => prev.map(l => l._id === labId ? { ...l, members: l.members.filter(m => (m._id || m) !== myId) } : l));
    } catch (err) { alert(err.response?.data?.error || 'Failed to leave.'); }
  };

  const deleteLab = async (labId) => {
    if (!window.confirm('Delete this lab?')) return;
    try {
      await api.delete(`/api/labs/${labId}`);
      setLabs(prev => prev.filter(l => l._id !== labId));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  const postAnnouncement = async () => {
    if (!announceText.trim()) return;
    try {
      const res = await api.post(`/api/labs/${announceModal}/announce`, { content: announceText });
      setLabs(prev => prev.map(l => l._id === announceModal ? res.data : l));
      setAnnounceModal(null); setAnnounceText('');
    } catch (err) { alert(err.response?.data?.error || 'Failed to post.'); }
  };

  const isMember = (lab) => lab.members?.some(m => (m._id || m) === myId || (m._id || m)?.toString() === myId);
  const isHost = (lab) => (lab.host?._id || lab.host) === myId || (lab.host?._id || lab.host)?.toString() === myId;

  return (
    <div className="network-layout">
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
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
      {/* Sidebar */}
      <div className="card network-sidebar">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Labs & Grants</h2>
        <div className="network-nav-item"><span>All Labs</span><span style={{ fontWeight: 600 }}>{labs.length}</span></div>
        <div className="network-nav-item"><span>My Labs</span><span style={{ fontWeight: 600 }}>{labs.filter(isHost).length}</span></div>
        <div className="network-nav-item"><span>Joined Labs</span><span style={{ fontWeight: 600 }}>{labs.filter(l => isMember(l) && !isHost(l)).length}</span></div>
      </div>

      {/* Main */}
      <div>
        {/* Header */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreate ? 20 : 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Research Labs</h1>
            <button className="btn-primary" onClick={() => setShowCreate(!showCreate)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> {showCreate ? 'Cancel' : 'Host a Lab'}
            </button>
          </div>

          {showCreate && (
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create New Lab</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <input placeholder="Lab Name *" value={newLab.name} onChange={e => setNewLab({ ...newLab, name: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }} />
                <input placeholder="Research Focus (e.g. Quantum Computing, ML)" value={newLab.researchFocus} onChange={e => setNewLab({ ...newLab, researchFocus: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }} />
                <textarea placeholder="Lab Description" value={newLab.description} onChange={e => setNewLab({ ...newLab, description: e.target.value })} rows={3}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
                <input placeholder="Tags (comma separated)" value={newLab.tags} onChange={e => setNewLab({ ...newLab, tags: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="btn-primary" onClick={createLab}>Create Lab</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Labs List */}
        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading labs...</div>
        ) : labs.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Microscope size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No labs yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Be the first to host a research lab!</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>Host a Lab</button>
          </div>
        ) : labs.map(lab => {
          const amHost = isHost(lab);
          const amMember = isMember(lab);
          const isExpanded = expandedLab === lab._id;

          return (
            <div key={lab._id} className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="item-icon" style={{ background: 'var(--accent-light)', flexShrink: 0 }}>
                  <Microscope color="var(--accent-color)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{lab.name}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Host: <strong>{lab.host?.name || 'Unknown'}</strong> &nbsp;•&nbsp;
                        <Users size={13} style={{ verticalAlign: -2 }} /> {lab.members?.length || 0} members
                      </div>
                      {lab.researchFocus && (
                        <div style={{ fontSize: 13, color: 'var(--accent-color)', fontWeight: 500, marginBottom: 6 }}>
                          Focus: {lab.researchFocus}
                        </div>
                      )}
                    </div>
                    {amHost && (
                      <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        You're the Host
                      </span>
                    )}
                    {amMember && !amHost && (
                      <span style={{ background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        Member
                      </span>
                    )}
                  </div>

                  {lab.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{lab.description}</p>
                  )}

                  {lab.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {lab.tags.map((tag, i) => (
                        <span key={i} style={{ background: '#f1f5f9', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {!amMember && (
                      <button className="btn-primary" onClick={() => joinLab(lab._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20 }}>
                        <Users size={14} /> Join Lab
                      </button>
                    )}
                    {amMember && !amHost && (
                      <button className="btn-secondary" onClick={() => leaveLab(lab._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20 }}>
                        <LogOut size={14} /> Leave Lab
                      </button>
                    )}
                    {amHost && (
                      <>
                        <button className="btn-primary" onClick={() => setAnnounceModal(lab._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20 }}>
                          <Megaphone size={14} /> Post Announcement
                        </button>
                        <button className="btn-secondary" onClick={() => deleteLab(lab._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, color: '#ef4444', borderColor: '#fecaca' }}>
                          <Trash2 size={14} /> Delete Lab
                        </button>
                      </>
                    )}
                    {lab.announcements?.length > 0 && (
                      <button className="btn-secondary" onClick={() => setExpandedLab(isExpanded ? null : lab._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20 }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {lab.announcements.length} Announcement{lab.announcements.length > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>

                  {/* Announcements */}
                  {isExpanded && lab.announcements?.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Announcements</h4>
                      {[...lab.announcements].reverse().map((a, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 8, borderLeft: '3px solid var(--accent-color)' }}>
                          <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{a.content}</p>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Grants Section */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Active Grants</h2>
          <div className="item-card">
            <div className="item-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}><Award /></div>
            <div className="item-content">
              <h3>NSF Quantum Leap Challenge Institute</h3>
              <div className="item-meta">National Science Foundation • $1.2M • 2024–2027</div>
              <div className="item-description">Funding to accelerate hybrid AI-Quantum physics simulations.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {announceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Post Announcement</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setAnnounceModal(null); setAnnounceText(''); }} />
            </div>
            <textarea
              placeholder="Write your announcement for lab members..."
              value={announceText}
              onChange={e => setAnnounceText(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setAnnounceModal(null); setAnnounceText(''); }}>Cancel</button>
              <button className="btn-primary" onClick={postAnnouncement}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
