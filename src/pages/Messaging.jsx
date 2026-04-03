import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit, Send, Circle, MessageSquare as MsgIcon, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function timeFormat(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Messaging() {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const myId = user?._id || user?.id;

  // Pre-open a conversation if navigated with ?userId=...&name=...
  const preOpenUserId = searchParams.get('userId');
  const preOpenName = searchParams.get('name');

  // Load conversations
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/messages/conversations');
        setConversations(res.data);

        // If navigated with a userId query param, auto-open that conversation
        if (preOpenUserId) {
          const existing = res.data.find(c => c.otherUserId.toString() === preOpenUserId);
          if (existing) {
            setActiveConvo(existing);
          } else {
            // No existing conversation, create a placeholder
            setActiveConvo({
              conversationId: null,
              otherUserId: preOpenUserId,
              otherUserName: preOpenName || 'User',
              otherUserTitle: 'Researcher',
              lastMessage: '',
              unreadCount: 0,
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, [preOpenUserId, preOpenName]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!activeConvo?.otherUserId) return;
    const loadMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${activeConvo.otherUserId}`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();
  }, [activeConvo?.otherUserId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const fromMe = msg.sender.toString() === myId.toString();
      // Add to messages if it's the current conversation
      if (activeConvo && (msg.sender.toString() === activeConvo.otherUserId.toString() || msg.receiver.toString() === activeConvo.otherUserId.toString())) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (!fromMe) socket.emit('mark_read', { otherUserId: activeConvo.otherUserId });
      }
      // Update conversations list
      setConversations(prev => {
        const otherId = fromMe ? msg.receiver.toString() : msg.sender.toString();
        const idx = prev.findIndex(c => c.otherUserId.toString() === otherId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { 
            ...updated[idx], 
            lastMessage: msg.content, 
            lastMessageAt: msg.createdAt,
            unreadCount: (!fromMe && (!activeConvo || activeConvo.otherUserId !== otherId)) ? (updated[idx].unreadCount + 1) : updated[idx].unreadCount
          };
          // Move to top
          const item = updated.splice(idx, 1)[0];
          return [item, ...updated];
        } else {
          // New conversation from someone
          return [{
            conversationId: msg.conversationId,
            otherUserId: otherId,
            otherUserName: msg.senderName || 'Researcher', // Note: senderName should ideally be provided by socket emit
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: fromMe ? 0 : 1
          }, ...prev];
        }
      });
    };

    const handleSent = (msg) => {
      if (activeConvo && msg.receiver.toString() === activeConvo.otherUserId.toString()) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update conversations list for the sender's own UI
      setConversations(prev => {
        const otherId = msg.receiver.toString();
        const idx = prev.findIndex(c => c.otherUserId.toString() === otherId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], lastMessage: msg.content, lastMessageAt: msg.createdAt };
          const item = updated.splice(idx, 1)[0];
          return [item, ...updated];
        } else {
          // New conversation - trigger a refresh for this contact
          api.get(`/api/messages/${otherId}`).then(res => setMessages(res.data));
          return [{
            conversationId: msg.conversationId,
            otherUserId: msg.receiver,
            otherUserName: activeConvo?.otherUserName || 'User',
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: 0
          }, ...prev];
        }
      });
    };

    const handleTyping = ({ userId }) => {
      if (activeConvo && userId === activeConvo.otherUserId) setIsTyping(true);
    };
    const handleStopTyping = ({ userId }) => {
      if (activeConvo && userId === activeConvo.otherUserId) setIsTyping(false);
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    if (activeConvo?.otherUserId) {
      socket.emit('mark_read', { otherUserId: activeConvo.otherUserId });
    }

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeConvo, myId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if ((!newMsg.trim() && !selectedImage) || !socket || !activeConvo) return;
    socket.emit('send_message', {
      receiverId: activeConvo.otherUserId,
      content: newMsg.trim(),
      image: selectedImage
    });
    socket.emit('stop_typing', { receiverId: activeConvo.otherUserId });
    setNewMsg('');
    setSelectedImage(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setNewMsg(e.target.value);
    if (socket && activeConvo) {
      socket.emit('typing', { receiverId: activeConvo.otherUserId });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { receiverId: activeConvo.otherUserId });
      }, 2000);
    }
  };

  const filteredConvos = conversations.filter(c =>
    c.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="network-layout" style={{ gridTemplateColumns: '340px 1fr' }}>
      {/* Conversations List */}
      <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Messaging</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Circle size={8} fill={isConnected ? '#4ade80' : '#ef4444'} stroke="none" />
            <Edit size={18} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
          </div>
        </div>

        <div style={{ padding: '10px 16px' }}>
          <div className="search-box" style={{ width: '100%', background: '#f8fafc' }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search messages"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading conversations...</div>
          ) : filteredConvos.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              {searchTerm ? 'No conversations found' : 'No conversations yet. Visit a profile to start messaging!'}
            </div>
          ) : (
            filteredConvos.map((convo) => {
              const isActive = activeConvo?.otherUserId?.toString() === convo.otherUserId.toString();
              const isOnline = onlineUsers.has(convo.otherUserId);
              return (
                <div
                  key={convo.conversationId || convo.otherUserId}
                  onClick={() => setActiveConvo(convo)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: isActive ? '#e0f2fe' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className="share-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                        {convo.otherUserName?.charAt(0) || 'U'}
                      </div>
                      {isOnline && (
                        <div style={{
                          position: 'absolute', bottom: 1, right: 1, width: 12, height: 12,
                          borderRadius: '50%', background: '#4ade80', border: '2px solid white'
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{convo.otherUserName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeFormat(convo.lastMessageAt)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {convo.lastMessage || 'Start a conversation'}
                      </div>
                    </div>
                    {convo.unreadCount > 0 && (
                      <div style={{
                        background: 'var(--accent-color)', color: 'white', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, alignSelf: 'center', flexShrink: 0,
                      }}>
                        {convo.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <MsgIcon size={64} strokeWidth={1} style={{ marginBottom: 16, color: 'var(--border-color)' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Your Messages</h3>
            <p style={{ fontSize: 14 }}>Select a conversation or visit a profile to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ position: 'relative' }}>
                <div className="share-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                  {activeConvo.otherUserName?.charAt(0) || 'U'}
                </div>
                {onlineUsers.has(activeConvo.otherUserId) && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                    borderRadius: '50%', background: '#4ade80', border: '2px solid white'
                  }} />
                )}
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>{activeConvo.otherUserName}</h2>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {activeConvo.otherUserTitle || 'Researcher'}
                  {onlineUsers.has(activeConvo.otherUserId) && (
                    <span style={{ color: '#4ade80', fontWeight: 600, marginLeft: 4 }}>• Online</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40, fontSize: 13 }}>
                  No messages yet. Send a message to start the conversation! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender === myId || msg.sender?.toString() === myId;
                  return (
                    <div key={msg._id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                      <div style={{
                        padding: '10px 16px',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMine ? 'var(--accent-color)' : '#f1f5f9',
                        color: isMine ? 'white' : 'var(--text-primary)',
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}>
                         {msg.image && (
                           <div style={{ 
                             margin: '-10px -16px 8px -16px',
                             overflow: 'hidden',
                             borderTopLeftRadius: isMine ? 18 : 18,
                             borderTopRightRadius: isMine ? 18 : 18,
                             borderBottomLeftRadius: isMine ? 4 : 18,
                             borderBottomRightRadius: isMine ? 18 : 4,
                           }}>
                             <img 
                               src={msg.image} 
                               alt="Shared" 
                               style={{ 
                                 width: '100%',
                                 maxWidth: 320, 
                                 display: 'block',
                                 maxHeight: 400, 
                                 objectFit: 'cover',
                                 cursor: 'pointer',
                                 transition: 'transform 0.3s ease'
                               }} 
                               onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                               onClick={() => window.open(msg.image, '_blank')}
                             />
                           </div>
                         )}
                        {msg.content && <div>{msg.content}</div>}
                      </div>
                      <div style={{
                        fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3,
                        textAlign: isMine ? 'right' : 'left', paddingInline: 8,
                      }}>
                        {timeFormat(msg.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 12px' }}>
                  {activeConvo.otherUserName} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)' }}>
              {/* Image Preview */}
              {selectedImage && (
                <div style={{ position: 'relative', marginBottom: 12, display: 'inline-block' }}>
                  <img src={selectedImage} alt="Selected" style={{ maxHeight: 100, borderRadius: 8, border: '1px solid var(--border-color)' }} />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setSelectedImage(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <button 
                    className="btn-secondary"
                    title="Attachments"
                    style={{ 
                      padding: 10, 
                      borderRadius: '50%', 
                      color: 'var(--text-secondary)', 
                      background: '#f1f5f9',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <ImageIcon size={22} color="#0284c7" />
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setSelectedImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newMsg}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, 
                      padding: '12px 18px', 
                      borderRadius: 24,
                      border: '1px solid var(--border-color)', 
                      outline: 'none',
                      fontSize: 14, 
                      background: '#f8fafc',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.background = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleSend}
                  disabled={(!newMsg.trim() && !selectedImage) || !isConnected}
                  style={{ 
                    padding: '10px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    borderRadius: 24,
                    background: (!newMsg.trim() && !selectedImage) ? '#cbd5e1' : 'var(--accent-color)',
                    border: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={18} /> Send
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingLeft: 56 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }}></div>
                  Direct access to: <span style={{ color: '#0284c7', fontWeight: 600 }}>OneDrive\Pictures</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
