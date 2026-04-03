import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Send, Search, CheckCircle } from 'lucide-react';
import api from '../api/axios';

export default function QuickShareModal({ isOpen, onClose, user }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/communities').then(res => {
        setUsers(Array.isArray(res.data) ? res.data : []);
      }).catch(console.error);
    } else {
      // Reset state on close
      setSelectedImage(null);
      setSearchTerm('');
      setSelectedUser(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!selectedUser || !selectedImage) return;
    setIsSending(true);
    try {
      // We use the same message endpoint. 
      // Socket would be better but REST is more reliable for a one-off share from a modal if socket isn't globally available here.
      // However, the backend expects messages via socket usually. 
      // Let's check messageRoutes.js to see if there's a POST endpoint.
      await api.post(`/api/messages/${selectedUser._id || selectedUser.id}`, {
        content: "Shared an image with you!",
        image: selectedImage
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to share image.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (u._id || u.id) !== (user?._id || user?.id)
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', zIndex: 3000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div 
        style={{ 
          background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, 
          overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Share Image</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a' }}>Sent Successfully!</h3>
              <p style={{ color: '#64748b', marginTop: 8 }}>Your image has been shared with {selectedUser?.name}.</p>
            </div>
          ) : (
            <>
              {/* Step 1: Choose Image */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 10 }}>1. Choose Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                {!selectedImage ? (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    style={{ 
                      height: 120, border: '2px dashed #e2e8f0', borderRadius: 12, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                      background: '#f8fafc'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#f1f7ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <ImageIcon size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Open Photos from Folder</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>C:\Users\Admin\OneDrive\Pictures</span>
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={selectedImage} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'contain', background: '#f8fafc' }} />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      style={{ 
                        position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', 
                        color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Choose Recipient */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 10 }}>2. Share with Person</label>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search researcher..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ 
                      width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, 
                      border: '1px solid #e2e8f0', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>No results found</div>
                  ) : filteredUsers.map(u => (
                    <div 
                      key={u._id || u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', 
                        cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                        background: selectedUser?._id === u._id || selectedUser?.id === u.id ? '#f0f9ff' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', background: '#0284c7', 
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600
                      }}>
                        {u.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{u.title || 'Researcher'}</div>
                      </div>
                      { (selectedUser?._id === u._id || selectedUser?.id === u.id) && <CheckCircle size={16} color="#0284c7" /> }
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSend}
                disabled={!selectedUser || !selectedImage || isSending}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: 12, 
                  background: (!selectedUser || !selectedImage) ? '#cbd5e1' : '#0284c7',
                  color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                {isSending ? 'Sharing...' : <><Send size={18} /> Share Image Now</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
