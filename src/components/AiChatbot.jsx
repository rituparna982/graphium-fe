import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Loader2, MessageSquare, BookOpen, Microscope } from 'lucide-react';
import api from '../api/axios';

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am Graphium AI, your research assistant. How can I help with your scientific discovery today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await api.post('/api/posts/ai-chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      console.error('[AI CHAT] Error:', err);
      setMessages(prev => [...prev, { role: 'ai', text: 'I encountered an error while researching. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 32, right: 32, width: 64, height: 64, border: 'none',
            borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: 'white', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)', transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={32} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, width: 380, height: 500,
          background: 'white', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2000,
          animation: 'fadeInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <Sparkles size={20} />
               <span style={{ fontWeight: 800, fontSize: 15 }}>Ask Graphium AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '10px 14px', borderRadius: 16,
                background: m.role === 'user' ? '#7c3aed' : 'white',
                color: m.role === 'user' ? 'white' : '#334155',
                fontSize: 13, lineHeight: 1.5,
                boxShadow: m.role === 'ai' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'ai' ? 4 : 16
              }}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '10px 16px', borderRadius: 12, color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Loader2 size={16} className="animate-spin" /> AI is thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 16, background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
            <input 
              type="text" 
              placeholder="Ask about papers, ideas..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 20, padding: '10px 16px', fontSize: 13, outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              style={{ 
                width: 40, height: 40, borderRadius: '50%', background: '#7c3aed', color: 'white', 
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: inputText.trim() ? 'pointer' : 'default', opacity: inputText.trim() ? 1 : 0.5 
              }}
            >
              <Send size={18} />
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '0 16px 16px', background: 'white', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setInputText('How does this paper approach methodology?')} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>
               Methodology?
            </button>
            <button onClick={() => setInputText('Brainstorm new research ideas in Quantum AI')} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}>
               Ideas?
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
