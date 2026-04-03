import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, MessageSquare, Megaphone, Users, Plus, 
  Download, FileUp, Send, MoreVertical, Layout, 
  Settings, Folder, Globe, Search 
} from 'lucide-react';

export default function LabRoom() {
  const { labId } = useParams();
  const { user } = useAuth();
  const [lab, setLab] = useState(null);
  const [activeTab, setActiveTab] = useState('stream'); // 'stream', 'work', 'people'
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/api/labs').then(res => {
      const found = res.data.find(l => l._id === labId);
      setLab(found);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [labId]);

  const handlePost = async () => {
    if (!postText.trim()) return;
    try {
      const res = await api.post(`/api/labs/${labId}/lab-posts`, { title: 'Lab Update', content: postText });
      setLab(prev => ({
        ...prev,
        posts: [...(prev.posts || []), res.data]
      }));
      setPostText('');
    } catch (err) {
      alert('Failed to post');
    }
  };

  const handleFileUpload = async () => {
    const fileName = window.prompt("Enter file name:");
    if (!fileName) return;
    setUploading(true);
    try {
      const mockUrl = `https://storage.googleapis.com/graphium-labs/${labId}/${Date.now()}_${fileName}`;
      const res = await api.post(`/api/labs/${labId}/files`, {
        name: fileName,
        url: mockUrl,
        type: 'application/pdf',
        size: Math.floor(Math.random() * 1024 * 1024)
      });
      setLab(prev => ({
        ...prev,
        files: [...(prev.files || []), res.data]
      }));
    } catch (err) {
      alert('Upload failed');
    }
    setUploading(false);
  };

  if (loading) return <div className="loading-state">Loading Lab Workspace...</div>;
  if (!lab) return <div className="error-state">Lab not found or you don't have access.</div>;

  const amHost = (lab.host?._id || lab.host) === user?._id;

  return (
    <div className="lab-room-container" style={{ padding: '20px 0' }}>
      {/* Banner */}
      <div className="card" style={{ 
        position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', 
        marginBottom: 24, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32
      }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <Settings style={{ cursor: 'pointer', opacity: 0.8 }} />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{lab.name}</h1>
        <p style={{ fontSize: 18, opacity: 0.9 }}>{lab.researchFocus || 'Research Workspace'}</p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 30, borderBottom: '1px solid var(--border-color)' }}>
        {['stream', 'work', 'people'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: 'none', border: 'none', padding: '12px 10px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '3px solid var(--accent-color)' : '3px solid transparent',
              textTransform: 'capitalize', marginBottom: -2
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: activeTab === 'stream' ? '240px 1fr' : '1fr', gap: 24 }}>
        
        {activeTab === 'stream' && (
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Upcoming</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No work due soon</p>
              <button style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, marginTop: 12, padding: 0, cursor: 'pointer' }}>View all</button>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Invite Members</h3>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
                {lab._id.substring(0, 8)}
                <span style={{ color: 'var(--accent-color)', cursor: 'pointer' }}>Copy</span>
              </div>
            </div>
          </div>
        )}

        <div className="main-content">
          {activeTab === 'stream' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Share box */}
              <div className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div className="me-avatar" style={{ width: 40, height: 40 }}>{user?.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <textarea 
                    placeholder="Announce something to your lab..."
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100, marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => setPostText('')}>Cancel</button>
                    <button className="btn-primary" onClick={handlePost} disabled={!postText.trim()}>Post</button>
                  </div>
                </div>
              </div>

              {/* Feed */}
              {lab.announcements?.map((ann, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                     <div className="me-avatar" style={{ width: 40, height: 40 }}>{ann.author?.name?.charAt(0) || 'U'}</div>
                     <div>
                       <div style={{ fontWeight: 700, fontSize: 14 }}>{ann.author?.name || 'Researcher'}</div>
                       <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(ann.createdAt).toLocaleString()}</div>
                     </div>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{ann.content}</p>
                </div>
              ))}
              
              {lab.posts?.map((p, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                     <div className="me-avatar" style={{ width: 40, height: 40 }}>{p.author?.name?.charAt(0) || 'U'}</div>
                     <div>
                       <div style={{ fontWeight: 700, fontSize: 14 }}>{p.author?.name || 'Researcher'}</div>
                       <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Research Update • {new Date(p.createdAt).toLocaleString()}</div>
                     </div>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.title}</h4>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{p.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'work' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Shared Materials</h2>
                <button className="btn-primary" onClick={handleFileUpload} disabled={uploading}>
                  <Plus size={16} /> Create / Upload
                </button>
              </div>
              
              {lab.files?.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {lab.files.map((file, i) => (
                    <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <FileText size={20} color="var(--accent-color)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Uploaded by {file.uploadedBy?.name || 'Member'} • {(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => window.open(file.url)}>
                        <Download size={14} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                  <Folder size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No materials shared yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
               <div>
                 <h2 style={{ fontSize: 24, color: 'var(--accent-color)', borderBottom: '1px solid var(--accent-color)', paddingBottom: 12, marginBottom: 20 }}>Host</h2>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="me-avatar" style={{ width: 40, height: 40 }}>{lab.host?.name?.charAt(0) || 'H'}</div>
                    <div style={{ fontWeight: 600 }}>{lab.host?.name || 'Lead Investigator'}</div>
                 </div>
               </div>

               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--accent-color)', paddingBottom: 12, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 24, color: 'var(--accent-color)' }}>Members</h2>
                    <span style={{ fontWeight: 600 }}>{lab.members?.length || 0} students/researchers</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {lab.members?.map((m, i) => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                        <div className="me-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{m.name?.charAt(0) || 'M'}</div>
                        <div style={{ flex: 1, fontSize: 14 }}>{m.name || 'Anonymous Researcher'}</div>
                        <MessageSquare size={16} color="var(--text-tertiary)" style={{ cursor: 'pointer' }} />
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
