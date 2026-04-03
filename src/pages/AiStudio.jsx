import React, { useState, useRef } from 'react';
import { BookOpen, Sparkles, Loader2, FileText, Share2, Download, History, Zap, Award, Microscope, Database, Globe } from 'lucide-react';
import api from '../api/axios';

const stats = [
  { label: 'Summaries Generated', value: '1,248', icon: Zap, color: '#f59e0b' },
  { label: 'Papers Analyzed', value: '892', icon: BookOpen, color: '#3b82f6' },
  { label: 'Research Time Saved', value: '450h', icon: History, color: '#10b981' },
];

export default function AiStudio() {
  const [pdfSummarizing, setPdfSummarizing] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const pdfInputRef = useRef(null);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid research paper in PDF format.');
      return;
    }

    setFileName(file.name);
    setPdfResult(null);
    setPdfSummarizing(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post('/api/posts/summarize-pdf', { pdfData: reader.result });
        setPdfResult(res.data.summary);
      } catch (err) {
        console.error('[AI STUDIO] PDF Error:', err);
        alert('AI was unable to process this research document. Ensure it is a standard PDF.');
      } finally {
        setPdfSummarizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!pdfResult) return;
    try {
      await api.post('/api/posts', {
        category: 'paper',
        content: pdfResult.summary,
        paper: {
          title: pdfResult.title,
          journal: pdfResult.journal,
          abstract: pdfResult.summary
        },
        aiSummary: pdfResult.summary
      });
      alert('Paper analysis shared to your feed!');
    } catch (err) {
      console.error('[AI STUDIO] Share error:', err);
      alert('Failed to share results. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        borderRadius: 24, padding: '48px 40px', color: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(124, 58, 237, 0.25)'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            <Sparkles size={16} /> NEW: Gemini 1.5 Research Model
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>AI Research Laboratory</h1>
          <p style={{ fontSize: 18, color: '#ede9fe', lineHeight: 1.6, marginBottom: 32 }}>
            Harness the power of Graphium's elite document intelligence to transform complex papers into highly structured, actionable research insights.
          </p>
          
          <div style={{ display: 'flex', gap: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: -50, left: '50%', width: 300, height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        {/* Analysis Center */}
        <div className="card" style={{ padding: 40, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
          {!pdfResult && !pdfSummarizing ? (
            <div 
              onClick={() => pdfInputRef.current?.click()}
              style={{
                flex: 1, border: '3px dashed #e2e8f0', borderRadius: 24, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s',
                background: '#f8fafc'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#f5f3ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <div style={{ 
                width: 100, height: 100, background: 'white', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: 24, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}>
                <FileText size={48} color="#7c3aed" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Drop your research paper here</h2>
              <p style={{ color: '#64748b', fontSize: 16, maxWidth: 460, textAlign: 'center' }}>
                Select a PDF from your computer to begin a deep AI-driven analysis of objectives, methodology, and results.
              </p>
              <div style={{ 
                marginTop: 32, padding: '12px 32px', background: '#7c3aed', color: 'white', 
                borderRadius: 30, fontWeight: 700, fontSize: 16, boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.4)'
              }}>
                Choose File
              </div>
              <input type="file" accept=".pdf" ref={pdfInputRef} style={{ display: 'none' }} onChange={handlePdfUpload} />
            </div>
          ) : pdfSummarizing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: 120, height: 120, position: 'relative', marginBottom: 32 }}>
                <Loader2 size={120} className="animate-spin" color="#7c3aed" style={{ opacity: 0.15 }} />
                <div style={{ position: 'absolute', top: 35, left: 35 }}>
                  <Sparkles size={50} color="#7c3aed" />
                </div>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#4c1d95', marginBottom: 16 }}>Deep Reading Research...</h2>
              <p style={{ color: '#64748b', fontSize: 16, maxWidth: 500 }}>
                Graphium AI is performing a multi-modal analysis of your paper. 
                Extracting high-fidelity methodology and outcome data.
              </p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                   <div style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <FileText size={28} color="#ef4444" />
                   </div>
                   <div>
                     <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{pdfResult.title || fileName}</h3>
                     <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                       <Award size={14} /> Analysis Complete • {pdfResult.journal}
                     </div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ padding: '10px 20px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={16} /> Export
                  </button>
                  <button 
                    onClick={handleShare}
                    style={{ padding: '10px 20px', borderRadius: 10, background: '#7c3aed', color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Share2 size={16} /> Share to Feed
                  </button>
                </div>
              </div>

              <div style={{ background: '#fdfcfe', borderRadius: 24, padding: 32, border: '1px solid #ddd6fe', position: 'relative', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)' }}>
                <div style={{ position: 'absolute', top: -14, left: 32, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
                  AI RESEARCH INSIGHTS
                </div>
                <div style={{ fontSize: 17, lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                  <div style={{ marginBottom: 16 }}>{pdfResult.summary}</div>
                  {pdfResult.methodology && (
                    <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 16 }}>
                       <strong>🔍 Methodology:</strong> {pdfResult.methodology}
                    </div>
                  )}
                  {pdfResult.results && (
                    <div style={{ marginTop: 16 }}>
                       <strong>📈 Key Findings:</strong> {pdfResult.results}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => { setPdfResult(null); setFileName(''); }}
                style={{ marginTop: 32, padding: '14px 24px', borderRadius: 12, background: 'transparent', color: '#7c3aed', border: '2px solid #ddd6fe', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '32px auto 0' }}
              >
                Clear Laboratory & Upload New Paper
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Laboratory Tools</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Methodology Extractor', icon: Microscope, desc: 'Deep dive into research methods' },
                { label: 'Data Relationship Hub', icon: Database, desc: 'Connect findings to global sets' },
                { label: 'Citations Network', icon: Globe, desc: 'Map research impact' },
              ].map((tool, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '8px', borderRadius: 12, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <tool.icon size={20} color="#64748b" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{tool.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24, textAlign: 'center', background: '#0f172a', color: 'white' }}>
            <Sparkles size={32} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: 14, fontWeight: 700 }}>AI Pro Feature</h4>
            <p style={{ fontSize: 12, opacity: 0.7, margin: '8px 0 20px' }}>Unlock unlimited monthly paper analysis and batch exports.</p>
            <button style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#3b82f6', border: 'none', color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
