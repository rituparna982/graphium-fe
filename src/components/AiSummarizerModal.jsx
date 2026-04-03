import React, { useState, useRef } from 'react';
import { X, BookOpen, Sparkles, Loader2, FileText, Send, Download, Share2 } from 'lucide-react';
import api from '../api/axios';

export default function AiSummarizerModal({ isOpen, onClose }) {
  const [pdfSummarizing, setPdfSummarizing] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const pdfInputRef = useRef(null);

  if (!isOpen) return null;

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
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
        console.error('[AI MODAL] PDF Error:', err);
        alert('AI was unable to process this PDF. Ensure it is not password protected.');
      } finally {
        setPdfSummarizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white', width: '100%', maxWidth: 700, borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          padding: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={24} /> AI Research Summarizer
            </h2>
            <p style={{ fontSize: 13, margin: '8px 0 0', opacity: 0.9 }}>Transform dense papers into actionable insights in seconds</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: '50%' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
          {!pdfResult && !pdfSummarizing ? (
            <div 
              onClick={() => pdfInputRef.current?.click()}
              style={{
                border: '3px dashed #ddd6fe', borderRadius: 20, padding: 60, textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.3s', background: '#fcfaff'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#7c3aed'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fcfaff'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
            >
              <div style={{ width: 80, height: 80, background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <FileText size={40} color="#7c3aed" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#4c1d95', marginBottom: 8 }}>Click to upload research paper</h3>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Support for PhD papers, journal articles, and PDF documents</p>
              <div style={{ marginTop: 24, display: 'inline-block', padding: '8px 24px', background: '#7c3aed', color: 'white', borderRadius: 24, fontWeight: 600, fontSize: 14 }}>
                Select PDF
              </div>
              <input type="file" accept=".pdf" ref={pdfInputRef} style={{ display: 'none' }} onChange={handlePdfUpload} />
            </div>
          ) : pdfSummarizing ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
                <Loader2 size={100} className="animate-spin" color="#7c3aed" style={{ opacity: 0.2 }} />
                <Sparkles size={40} color="#7c3aed" style={{ position: 'absolute', top: 30, left: 30 }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>AI is deep reading your paper...</h3>
              <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>Gemini Flash is extracting methodology, findings, and core objectives from your document.</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 40, height: 40, background: '#fef2f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{fileName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Document processed successfully</div>
                </div>
              </div>

              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', position: 'relative' }}>
                <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  {pdfResult}
                </div>
                <div style={{ position: 'absolute', top: -10, right: 20, background: '#7c3aed', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                  AI SUMMARY
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button 
                  onClick={() => { setPdfResult(null); setFileName(''); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#f3f4f6', color: '#374151', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Process Another Paper
                </button>
                <button 
                  onClick={() => { alert('Sharing feature coming soon!'); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#7c3aed', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Share2 size={18} /> Share Results
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 32px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Powered by Google Gemini 1.5 Doc AI Engine</p>
        </div>
      </div>
    </div>
  );
}
