import { Download, Quote, Share2, Bookmark, BarChart2, Database, Code } from 'lucide-react';

export default function Publication() {
  return (
    <div className="article-layout">
      <div className="card" style={{ padding: 40 }}>
         <span style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent-color)', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Published Article</span>
         <h1 className="article-title">Neural Networks for Quantum Chemistry: Accelerating Variational Solvers on NISQ Devices</h1>
         <div className="article-meta" style={{ marginBottom: 32 }}>
            <div className="share-avatar" style={{ width: 56, height: 56 }}>SC</div>
            <div>
               <div className="article-author" style={{ fontSize: 16 }}>Dr. Sarah Chen, James Wilson, Elena Rodriguez</div>
               <div style={{ marginTop: 4 }}>Nature Physics • October 2025 • DOI: 10.1038/s41567-025-xxxx</div>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', margin: '24px 0' }}>
           <button className="post-action-btn" style={{ flex: 'none', padding: '8px 16px', border: '1px solid var(--border-color)' }}><Download size={18} /> Download PDF</button>
           <button className="post-action-btn" style={{ flex: 'none', padding: '8px 16px' }}><Quote size={18} /> Cite (248)</button>
           <button className="post-action-btn" style={{ flex: 'none', padding: '8px 16px' }}><Share2 size={18} /> Share</button>
           <button className="post-action-btn" style={{ flex: 'none', padding: '8px 16px', marginLeft: 'auto' }}><Bookmark size={18} /> Save to Library</button>
         </div>

         <div className="article-body">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Abstract</h2>
            <p style={{ marginBottom: 24 }}>Simulating molecular dynamics on Noisy Intermediate-Scale Quantum (NISQ) hardware remains a significant challenge due to vanishing gradients and limited coherence times. We introduce a hybrid quantum-classical architecture where a classical neural network pre-optimizes the parameter space for the Variational Quantum Eigensolver (VQE), reducing overall circuit depth and required coherence time by up to 40%.</p>
            
            <div className="article-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '1px solid var(--border-color)', width: '100%', height: 360, marginBottom: 32, borderRadius: 12 }}>
               <BarChart2 size={64} color="var(--text-tertiary)" />
               <span style={{ marginLeft: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>Figure 1: VQE Optimization Landscape</span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Introduction</h2>
            <p>The intersection of quantum computing and machine learning provides novel avenues for solving classically intractable problems. In this paper, we explore how mapping parameterized quantum circuits to multi-layered perceptrons can identify promising sub-spaces in the objective landscape prior to deployment on actual quantum hardware.</p>
         </div>
      </div>
      <div>
         <div className="card widget-card">
           <h2 className="widget-title"><Database size={18} style={{ verticalAlign: -2, marginRight: 6 }} /> Associated Resources</h2>
           <div className="widget-item">
              <div className="widget-item-icon"><Code size={18} /></div>
              <div className="widget-item-text"><strong>Source Code</strong> github.com/quantum-vqe</div>
           </div>
           <div className="widget-item">
              <div className="widget-item-icon" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><strong style={{fontSize: 12}}>Zen</strong></div>
              <div className="widget-item-text"><strong>Training Dataset</strong> Zenodo Database</div>
           </div>
         </div>
         
         <div className="card news-widget" style={{ marginTop: 16 }}>
           <h2 className="news-header">More from the authors</h2>
           <ul className="news-list">
              <li className="news-item">
                 <div className="news-title">Towards fault-tolerant quantum computing via topological codes</div>
              </li>
              <li className="news-item">
                 <div className="news-title">Scaling superconducting qubits without cross-talk</div>
              </li>
           </ul>
         </div>
      </div>
    </div>
  );
}
