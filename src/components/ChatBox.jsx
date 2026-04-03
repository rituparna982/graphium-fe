import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minus, Circle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Image as ImageIcon } from 'lucide-react';

function timeFormat(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ChatBox({ recipientId, recipientName, onClose }) {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const isRecipientOnline = onlineUsers.has(recipientId);

  // Load message history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${recipientId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
      setLoading(false);
    };
    loadMessages();
  }, [recipientId]);

  // Socket event listeners for this conversation
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const sId = msg.sender?.toString();
      const rId = msg.receiver?.toString();
      const recId = recipientId?.toString();
      
      if (sId === recId || rId === recId) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if we received it
        if (sId === recId) {
          socket.emit('mark_read', { otherUserId: recipientId });
        }
      }
    };

    const handleSent = (msg) => {
      const rId = msg.receiver?.toString();
      const recId = recipientId?.toString();
      if (rId === recId) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId === recipientId) setIsTyping(true);
    };

    const handleStopTyping = ({ userId }) => {
      if (userId === recipientId) setIsTyping(false);
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    // Mark existing messages as read when opening chat
    socket.emit('mark_read', { otherUserId: recipientId });

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, recipientId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);

  const handleSend = () => {
    if ((!newMsg.trim() && !selectedImage) || !socket) return;
    socket.emit('send_message', { 
      receiverId: recipientId, 
      content: newMsg.trim(),
      image: selectedImage
    });
    socket.emit('stop_typing', { receiverId: recipientId });
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
    if (socket) {
      socket.emit('typing', { receiverId: recipientId });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { receiverId: recipientId });
      }, 2000);
    }
  };

  const myId = user?._id || user?.id;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 80,
      width: 340,
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 -2px 20px rgba(0,0,0,0.15)',
      borderRadius: '12px 12px 0 0',
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div
        onClick={() => setMinimized(!minimized)}
        style={{
          background: 'var(--accent-color)',
          color: 'white',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>
          {recipientName?.charAt(0) || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{recipientName}</div>
          <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Circle size={8} fill={isRecipientOnline ? '#4ade80' : '#94a3b8'} stroke="none" />
            {isRecipientOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Minus size={18} style={{ opacity: 0.8 }} />
          <X size={18} onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          <div style={{
            height: 320,
            overflowY: 'auto',
            padding: 12,
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40, fontSize: 13 }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40, fontSize: 13 }}>
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map((msg, idx) => {
                const sId = msg.sender?.toString();
                const mId = myId?.toString();
                const isMine = sId === mId;
                return (
                  <div key={msg._id || idx} style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                  }}>
                    <div style={{
                      padding: msg.image ? '4px' : '8px 12px',
                      borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isMine ? 'var(--accent-color)' : '#f1f5f9',
                      color: isMine ? 'white' : 'var(--text-primary)',
                      fontSize: 13,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      overflow: 'hidden'
                    }}>
                      {msg.image && (
                        <div style={{ minWidth: 200, marginBottom: msg.content ? 6 : 0 }}>
                          <img 
                            src={msg.image} 
                            alt="Shared" 
                            style={{ 
                              width: '100%', 
                              display: 'block', 
                              borderRadius: 10,
                              cursor: 'pointer',
                              background: '#f8fafc'
                            }} 
                            onClick={() => window.open(msg.image, '_blank')}
                          />
                        </div>
                      )}
                      {msg.content && <div style={{ padding: msg.image ? '4px 8px' : 0 }}>{msg.content}</div>}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-tertiary)',
                      marginTop: 2,
                      textAlign: isMine ? 'right' : 'left',
                      paddingInline: 4,
                    }}>
                      {timeFormat(msg.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 8px' }}>
                {recipientName} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
            {/* Image Preview */}
            {selectedImage && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', position: 'relative', background: '#f8fafc' }}>
                <img src={selectedImage} alt="Selected" style={{ maxHeight: 80, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                <button 
                  onClick={() => setSelectedImage(null)}
                  style={{ 
                    position: 'absolute', top: 4, left: 85, background: 'rgba(0,0,0,0.5)', 
                    color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div style={{
              padding: '8px 12px',
              background: 'white',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
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
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                title="Send image"
              >
                <ImageIcon size={18} />
              </button>
              <input
                type="text"
                value={newMsg}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: 13,
                  background: '#f8fafc',
                }}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={(!newMsg.trim() && !selectedImage) || !isConnected}
                style={{
                  background: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (newMsg.trim() || selectedImage) ? 'pointer' : 'not-allowed',
                  opacity: (newMsg.trim() || selectedImage) ? 1 : 0.5,
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
        </>
      )}
    </div>
  );
}
