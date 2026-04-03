import React from 'react';
import { ThumbsUp, MessageSquare, Quote, UserPlus, Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="core-rail" style={{ gridTemplateColumns: '260px 1fr' }}>
      <div>
        <div className="card network-sidebar">
           <h2 style={{fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)'}}>Manage Notifications</h2>
           <div className="network-nav-item" style={{background: '#f1f5f9', color:'var(--text-primary)'}}><span>All</span></div>
           <div className="network-nav-item"><span>Citations</span></div>
           <div className="network-nav-item"><span>Mentions</span></div>
           <div className="network-nav-item"><span>Connections</span></div>
        </div>
      </div>
      <div>
        <div className="card" style={{ padding: '24px 0' }}>
           <h1 style={{fontSize: 20, fontWeight: 700, marginBottom: 24, padding: '0 24px'}}>Notifications</h1>
           
           <div className="item-card" style={{ padding: '16px 24px', cursor: 'pointer', background: '#f8fafc' }}>
              <div className="item-icon" style={{background: '#e0f2fe', color: '#0284c7'}}><Quote size={20} /></div>
              <div className="item-content">
                 <div style={{ fontSize: 15 }}><strong>Prof. Bob Stevenson</strong> and 12 others cited your paper <strong>"Quantum Neural Networks for Material Discovery"</strong></div>
                 <div className="item-meta" style={{marginTop: 4}}>2 hours ago</div>
              </div>
           </div>
           
           <div className="item-card" style={{ padding: '16px 24px', cursor: 'pointer' }}>
              <div className="item-icon" style={{background: '#fef3c7', color: '#f59e0b'}}><MessageSquare size={20} /></div>
              <div className="item-content">
                 <div style={{ fontSize: 15 }}><strong>James Wilson</strong> commented on your recent dataset update.</div>
                 <div className="item-meta" style={{marginTop: 4}}>5 hours ago</div>
              </div>
           </div>

           <div className="item-card" style={{ padding: '16px 24px', cursor: 'pointer' }}>
              <div className="item-icon" style={{background: '#dcfce7', color: '#10b981'}}><UserPlus size={20} /></div>
              <div className="item-content">
                 <div style={{ fontSize: 15 }}><strong>Alice Walker</strong> accepted your collaboration request for the Q-Sim Lab.</div>
                 <div className="item-meta" style={{marginTop: 4}}>1 day ago</div>
              </div>
           </div>

           <div className="item-card" style={{ padding: '16px 24px', cursor: 'pointer' }}>
              <div className="item-icon" style={{background: '#f3e8ff', color: '#a855f7'}}><ThumbsUp size={20} /></div>
              <div className="item-content">
                 <div style={{ fontSize: 15 }}>Your article is trending! <strong>142 researchers</strong> recommended your recent update.</div>
                 <div className="item-meta" style={{marginTop: 4}}>2 days ago</div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
