import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Globe, FileText, AlertCircle, Edit, CheckCircle, Clock, Plus, X, Send, Trash2, RotateCcw, PenSquare } from 'lucide-react';
import PostModal from '../components/PostModal';

const STATUS_CONFIG = {
  draft:              { label: 'Draft',              bg: '#f1f5f9', color: '#64748b', icon: FileText },
  submitted:          { label: 'Submitted',          bg: '#e0f2fe', color: '#0369a1', icon: Clock },
  under_review:       { label: 'Under Review',       bg: '#ede9fe', color: '#7c3aed', icon: Clock },
  revision_requested: { label: 'Changes Requested',  bg: '#fef3c7', color: '#b45309', icon: AlertCircle },
  resubmitted:        { label: 'Resubmitted',        bg: '#d1fae5', color: '#059669', icon: RotateCcw },
  accepted:           { label: 'Accepted',           bg: '#d1fae5', color: '#059669', icon: CheckCircle },
  rejected:           { label: 'Rejected',           bg: '#fee2e2', color: '#dc2626', icon: X },
};

const UPCOMING = [
  { name: 'ICQN 2026', location: 'Geneva, Switzerland', date: 'Sept 12–15, 2026', deadline: 'May 1, 2026', deadlineColor: '#0284c7', deadlineBg: '#e0f2fe' },
  { name: 'NeurIPS 2026', location: 'Virtual', date: 'Dec 1–14, 2026', deadline: 'Jun 15, 2026', deadlineColor: '#ef4444', deadlineBg: '#fee2e2' },
  { name: 'APS March Meeting 2027', location: 'Los Angeles, CA', date: 'Mar 2–7, 2027', deadline: 'Oct 20, 2026', deadlineColor: '#059669', deadlineBg: '#d1fae5' },
];

export default function Conferences() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [newPaper, setNewPaper] = useState({ title: '', abstract: '', conference: '' });
  const [revisingId, setRevisingId] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPapers = () => {
    api.get('/api/conference-papers').then(res => setPapers(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPapers(); }, []);

  const submitPaper = async () => {
    if (!newPaper.title || !newPaper.conference) return;
    try {
      const res = await api.post('/api/conference-papers', newPaper);
      setPapers(prev => [res.data, ...prev]);
      setNewPaper({ title: '', abstract: '', conference: '' });
      setShowSubmit(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed to submit.'); }
  };

  const submitRevision = async (id) => {
    if (!revisionNote.trim()) return;
    try {
      const res = await api.patch(`/api/conference-papers/${id}/revise`, { note: revisionNote });
      setPapers(prev => prev.map(p => p._id === id ? res.data : p));
      setRevisingId(null); setRevisionNote('');
    } catch (err) { alert(err.response?.data?.error || 'Failed to submit revision.'); }
  };

  const deletePaper = async (id) => {
    if (!window.confirm('Delete this paper submission?')) return;
    try {
      await api.delete(`/api/conference-papers/${id}`);
      setPapers(prev => prev.filter(p => p._id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  return (
    <div className="core-rail">
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
      {/* Left sidebar */}
      <div>
        <div className="card widget-card">
          <div className="widget-title">My Schedule</div>
          {UPCOMING.slice(0, 2).map((c, i) => (
            <div key={i} className="widget-item">
              <div className="widget-item-icon" style={{ background: 'var(--accent-color)', color: 'white', fontSize: 11, fontWeight: 700 }}>
                {c.date.slice(0, 3)}
              </div>
              <div className="widget-item-text">
                <strong>{c.name}</strong>{c.location}
              </div>
            </div>
          ))}
        </div>

        <div className="card widget-card" style={{ marginTop: 16 }}>
          <div className="widget-title">My Submissions</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {Object.entries(
              papers.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
            ).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
            {papers.length === 0 && <p style={{ color: 'var(--text-tertiary)' }}>No submissions yet.</p>}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Author Dashboard */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSubmit ? 20 : 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Author Dashboard</h2>
            <button className="btn-primary" onClick={() => setShowSubmit(!showSubmit)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> {showSubmit ? 'Cancel' : 'Submit Paper'}
            </button>
          </div>

          {/* Submit Form */}
          {showSubmit && (
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>New Paper Submission</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <input placeholder="Paper Title *" value={newPaper.title} onChange={e => setNewPaper({ ...newPaper, title: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }} />
                <input placeholder="Conference Name *" value={newPaper.conference} onChange={e => setNewPaper({ ...newPaper, conference: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14 }} />
                <textarea placeholder="Abstract (optional)" value={newPaper.abstract} onChange={e => setNewPaper({ ...newPaper, abstract: e.target.value })} rows={3}
                  style={{ padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowSubmit(false)}>Cancel</button>
                  <button className="btn-primary" onClick={submitPaper} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Send size={14} /> Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Papers List */}
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading submissions...</div>
          ) : papers.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
              <p>No submissions yet. Submit your first paper!</p>
            </div>
          ) : papers.map(paper => {
            const cfg = STATUS_CONFIG[paper.status] || STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === paper._id;

            return (
              <div key={paper._id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 18, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <FileText size={15} color="var(--accent-color)" /> {paper.title}
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{paper.conference}</div>
                    {paper.submittedAt && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Submitted: {new Date(paper.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <StatusIcon size={13} /> {cfg.label}
                  </span>
                </div>

                {paper.abstract && (
                  <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', background: '#f8fafc', padding: '8px 12px', borderRadius: 6 }}>
                    {paper.abstract}
                  </div>
                )}

                {paper.reviewerNotes && (
                  <div style={{ marginTop: 10, background: '#fef3c7', padding: '10px 14px', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                    <strong>Reviewer Notes:</strong> {paper.reviewerNotes}
                  </div>
                )}

                {/* Revision History */}
                {paper.revisionHistory?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => setExpandedId(isExpanded ? null : paper._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--accent-color)', fontWeight: 600, padding: 0 }}>
                      {isExpanded ? '▲' : '▼'} {paper.revisionHistory.length} Revision{paper.revisionHistory.length > 1 ? 's' : ''} submitted
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 8 }}>
                        {paper.revisionHistory.map((r, i) => (
                          <div key={i} style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: 6, marginBottom: 6, borderLeft: '3px solid #10b981', fontSize: 13 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{r.note || '(No note)'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                              {new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  {paper.status === 'revision_requested' && revisingId !== paper._id && (
                    <button className="btn-primary" onClick={() => setRevisingId(paper._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, borderRadius: 20 }}>
                      <Edit size={13} /> Submit Revision
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => deletePaper(paper._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, borderRadius: 20, color: '#ef4444', borderColor: '#fecaca' }}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                {/* Revision Form */}
                {revisingId === paper._id && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Submit Revision</h4>
                    <textarea
                      placeholder="Describe your changes and responses to reviewer comments..."
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, resize: 'vertical', marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-secondary" onClick={() => { setRevisingId(null); setRevisionNote(''); }}>Cancel</button>
                      <button className="btn-primary" onClick={() => submitRevision(paper._id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Send size={13} /> Submit Revision
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming Conferences */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Upcoming Conferences & Call for Papers</h2>
          {UPCOMING.map((conf, i) => (
            <div key={i} className="item-card">
              <div className="item-icon"><Calendar /></div>
              <div className="item-content">
                <h3>{conf.name}</h3>
                <div className="item-meta"><MapPin size={13} style={{ verticalAlign: -2 }} /> {conf.location} • {conf.date}</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: conf.deadlineBg, color: conf.deadlineColor, padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                    Deadline: {conf.deadline}
                  </span>
                </div>
              </div>
              <div>
                <button className="btn-primary" onClick={() => { setShowSubmit(true); setNewPaper(p => ({ ...p, conference: conf.name })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Submit Paper
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
