import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, UserPlus, Check, Clock, X, Users, Send, ChevronDown, ChevronUp, PenSquare } from 'lucide-react';
import PostModal from '../components/PostModal';

export default function Network() {
  const { user } = useAuth();
  const myId = user?._id || user?.id;

  const [allUsers, setAllUsers] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [tab, setTab] = useState('discover'); // discover | requests | accepted
  const [requestModal, setRequestModal] = useState(null); // userId to send request to
  const [msgText, setMsgText] = useState('');
  const [topicText, setTopicText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/communities'),
      api.get('/api/collaborations'),
    ]).then(([usersRes, collabRes]) => {
      setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setCollabs(Array.isArray(collabRes.data) ? collabRes.data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getCollabWith = (userId) =>
    collabs.find(c =>
      c.requester?._id === userId || c.requester?.id === userId ||
      c.recipient?._id === userId || c.recipient?.id === userId
    );

  const sendRequest = async () => {
    if (!requestModal) return;
    try {
      const res = await api.post('/api/collaborations', {
        recipientId: requestModal,
        message: msgText,
        topic: topicText,
      });
      setCollabs(prev => [res.data, ...prev]);
      setRequestModal(null); setMsgText(''); setTopicText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request.');
    }
  };

  const respond = async (collabId, status) => {
    try {
      const res = await api.patch(`/api/collaborations/${collabId}`, { status });
      setCollabs(prev => prev.map(c => c._id === collabId ? res.data : c));
    } catch (err) { console.error(err); }
  };

  const cancelCollab = async (collabId) => {
    try {
      await api.delete(`/api/collaborations/${collabId}`);
      setCollabs(prev => prev.filter(c => c._id !== collabId));
    } catch (err) { console.error(err); }
  };

  const incomingRequests = collabs.filter(c =>
    (c.recipient?._id === myId || c.recipient?.id === myId) && c.status === 'pending'
  );
  const acceptedCollabs = collabs.filter(c => c.status === 'accepted');

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
      <div>
        <div className="card network-sidebar">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>My Network</h2>
          {[
            { key: 'discover', label: 'Discover Researchers', count: allUsers.length },
            { key: 'requests', label: 'Incoming Requests', count: incomingRequests.length },
            { key: 'accepted', label: 'My Collaborators', count: acceptedCollabs.length },
          ].map(item => (
            <div
              key={item.key}
              className="network-nav-item"
              onClick={() => setTab(item.key)}
              style={{ background: tab === item.key ? '#e0f2fe' : '', color: tab === item.key ? 'var(--accent-color)' : '' }}
            >
              <span>{item.label}</span>
              <span style={{ fontWeight: 600 }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div>
        {/* Incoming Requests Tab */}
        {tab === 'requests' && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Incoming Collaboration Requests</h2>
            {incomingRequests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No pending requests.</p>
            ) : incomingRequests.map(c => (
              <div key={c._id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div className="share-avatar" style={{ width: 48, height: 48, fontSize: 18, flexShrink: 0 }}>
                    {c.requester?.name?.charAt(0) || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.requester?.name || 'Researcher'}</div>
                    {c.topic && <div style={{ fontSize: 13, color: 'var(--accent-color)', marginTop: 2 }}>Topic: {c.topic}</div>}
                    {c.message && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, background: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>{c.message}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button className="btn-primary" onClick={() => respond(c._id, 'accepted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20 }}>
                        <Check size={14} /> Accept
                      </button>
                      <button className="btn-secondary" onClick={() => respond(c._id, 'declined')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20 }}>
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accepted Collaborators Tab */}
        {tab === 'accepted' && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>My Collaborators</h2>
            {acceptedCollabs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>No collaborators yet. Discover researchers and send requests!</p>
            ) : (
              <div className="network-grid">
                {acceptedCollabs.map(c => {
                  const other = (c.requester?._id === myId || c.requester?.id === myId) ? c.recipient : c.requester;
                  return (
                    <div key={c._id} className="card people-card interactive">
                      <div className="people-banner"></div>
                      <div className="people-avatar">{other?.name?.charAt(0) || 'U'}</div>
                      <div className="people-info">
                        <div className="people-name">{other?.name || 'Researcher'}</div>
                        {c.topic && <div className="people-headline">{c.topic}</div>}
                      </div>
                      <div className="people-action" style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/messaging?userId=${other?._id || other?.id}&name=${encodeURIComponent(other?.name || 'User')}`} style={{ flex: 1 }}>
                          <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 20 }}>
                            <Send size={13} /> Message
                          </button>
                        </Link>
                        <button className="btn-secondary" onClick={() => cancelCollab(c._id)} style={{ padding: '8px 12px', borderRadius: 20 }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Discover Tab */}
        {tab === 'discover' && (
          <div className="card">
            <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Suggested Researchers</span>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : allUsers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No researchers found yet.</div>
            ) : (
              <div className="network-grid">
                {allUsers.filter(u => (u._id || u.id) !== myId).map(match => {
                  const id = match._id || match.id;
                  const collab = getCollabWith(id);
                  const isSentByMe = collab?.requester?._id === myId || collab?.requester?.id === myId;

                  return (
                    <div key={id} className="card people-card interactive">
                      <div className="people-banner"></div>
                      <div className="people-avatar">{match.name?.charAt(0) || 'U'}</div>
                      <div className="people-info">
                        <div className="people-name">{match.name}</div>
                        <div className="people-headline">{match.title || 'Researcher'}</div>
                        <div className="people-shared"><BookOpen size={14} style={{ marginRight: 4 }} />{match.mutual || 0} shared citations</div>
                      </div>
                      <div className="people-action">
                        {!collab && (
                          <button className="btn-connect" onClick={() => setRequestModal(id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <UserPlus size={14} /> Collaborate
                          </button>
                        )}
                        {collab?.status === 'pending' && isSentByMe && (
                          <button className="btn-secondary" onClick={() => cancelCollab(collab._id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 20 }}>
                            <Clock size={14} /> Pending · Cancel
                          </button>
                        )}
                        {collab?.status === 'pending' && !isSentByMe && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-primary" onClick={() => respond(collab._id, 'accepted')} style={{ flex: 1, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <Check size={13} /> Accept
                            </button>
                            <button className="btn-secondary" onClick={() => respond(collab._id, 'declined')} style={{ flex: 1, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <X size={13} /> Decline
                            </button>
                          </div>
                        )}
                        {collab?.status === 'accepted' && (
                          <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 20, color: '#10b981', borderColor: '#d1fae5', background: '#ecfdf5' }}>
                            <Check size={14} /> Collaborating
                          </button>
                        )}
                        {collab?.status === 'declined' && (
                          <button className="btn-connect" onClick={() => setRequestModal(id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <UserPlus size={14} /> Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collaboration Request Modal */}
      {requestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Send Collaboration Request</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => { setRequestModal(null); setMsgText(''); setTopicText(''); }} />
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
              <button className="btn-secondary" onClick={() => { setRequestModal(null); setMsgText(''); setTopicText(''); }}>Cancel</button>
              <button className="btn-primary" onClick={sendRequest} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
