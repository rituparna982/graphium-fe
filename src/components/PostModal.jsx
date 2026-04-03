import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Calendar, MoreHorizontal, Globe, ChevronDown, Smile, FileText, Hash, Database, BookOpen, HelpCircle, Award, Newspaper } from 'lucide-react';
import api from '../api/axios';

const CATEGORIES = [
  { key: 'general', label: 'Update', icon: FileText, color: '#378fe9', placeholder: 'What do you want to talk about?' },
  { key: 'paper', label: 'Paper', icon: BookOpen, color: '#10b981', placeholder: 'Describe your research findings...' },
  { key: 'dataset', label: 'Dataset', icon: Database, color: '#8b5cf6', placeholder: 'Describe the dataset you are sharing...' },
  { key: 'question', label: 'Question', icon: HelpCircle, color: '#f59e0b', placeholder: 'What research question do you have?' },
  { key: 'event', label: 'Event', icon: Calendar, color: '#ec4899', placeholder: 'Share details about the event...' },
  { key: 'article', label: 'Article', icon: Newspaper, color: '#e06847', placeholder: 'Write your article...' },
];

export default function PostModal({ isOpen, onClose, user, profile, onPostSuccess }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('general');
  const fileInputRef = useRef(null);

  // Category-specific fields
  const [paperFields, setPaperFields] = useState({ title: '', journal: '', doi: '', abstract: '', coAuthors: '', year: '' });
  const [datasetFields, setDatasetFields] = useState({ title: '', source: '', url: '', size: '', format: '', license: '' });
  const [eventFields, setEventFields] = useState({ title: '', date: '', location: '', url: '', eventType: 'conference' });
  const [articleFields, setArticleFields] = useState({ title: '', subtitle: '', url: '' });

  if (!isOpen) return null;

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setContent('');
    setImage(null);
    setImagePreview(null);
    setActiveCategory('general');
    setPaperFields({ title: '', journal: '', doi: '', abstract: '', coAuthors: '', year: '' });
    setDatasetFields({ title: '', source: '', url: '', size: '', format: '', license: '' });
    setEventFields({ title: '', date: '', location: '', url: '', eventType: 'conference' });
    setArticleFields({ title: '', subtitle: '', url: '' });
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    
    setIsPosting(true);
    try {
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      const payload = { content, category: activeCategory, imageUrl };

      // Attach category-specific data
      if (activeCategory === 'paper' && paperFields.title) {
        payload.paper = {
          ...paperFields,
          coAuthors: paperFields.coAuthors ? paperFields.coAuthors.split(',').map(s => s.trim()) : [],
          year: paperFields.year ? parseInt(paperFields.year) : undefined
        };
        payload.target = paperFields.title;
      }
      if (activeCategory === 'dataset' && datasetFields.title) {
        payload.dataset = datasetFields;
        payload.target = datasetFields.title;
      }
      if (activeCategory === 'event' && eventFields.title) {
        payload.event = eventFields;
        payload.target = eventFields.title;
      }
      if (activeCategory === 'article' && articleFields.title) {
        payload.article = articleFields;
        payload.target = articleFields.title;
      }

      const res = await api.post('/api/posts', payload);
      
      resetForm();
      onPostSuccess(res.data);
      onClose();
    } catch (err) {
      alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--text-primary)',
    background: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block',
  };

  const fieldGroupStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginTop: 12,
    padding: '12px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2>Create a post</h2>
          <button className="modal-close-btn" onClick={() => { resetForm(); onClose(); }}><X size={24} /></button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 24px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: isActive ? `2px solid ${cat.color}` : '1px solid transparent',
                  background: isActive ? `${cat.color}10` : 'transparent',
                  color: isActive ? cat.color : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="modal-body" style={{ maxHeight: '55vh' }}>
          <div className="modal-user-info">
            <div className="share-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="modal-user-details">
              <h3>{user?.name || 'Researcher'}</h3>
              <div className="modal-privacy-select">
                <Globe size={12} />
                <span>Anyone</span>
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          <textarea 
            className="modal-textarea"
            placeholder={activeCat?.placeholder || 'What do you want to talk about?'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            style={{ minHeight: activeCategory === 'general' ? 150 : 80 }}
          />

          {/* Category-specific fields */}
          {activeCategory === 'paper' && (
            <div style={fieldGroupStyle}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Paper Title *</label>
                <input style={inputStyle} placeholder="e.g. Attention Is All You Need" value={paperFields.title} onChange={e => setPaperFields(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Journal / Conference</label>
                <input style={inputStyle} placeholder="e.g. Nature, NeurIPS" value={paperFields.journal} onChange={e => setPaperFields(p => ({ ...p, journal: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input style={inputStyle} type="number" placeholder="2026" value={paperFields.year} onChange={e => setPaperFields(p => ({ ...p, year: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>DOI</label>
                <input style={inputStyle} placeholder="10.1234/example" value={paperFields.doi} onChange={e => setPaperFields(p => ({ ...p, doi: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Co-authors (comma-separated)</label>
                <input style={inputStyle} placeholder="Jane Doe, John Smith" value={paperFields.coAuthors} onChange={e => setPaperFields(p => ({ ...p, coAuthors: e.target.value }))} />
              </div>
            </div>
          )}

          {activeCategory === 'dataset' && (
            <div style={fieldGroupStyle}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Dataset Name *</label>
                <input style={inputStyle} placeholder="e.g. ImageNet-2026" value={datasetFields.title} onChange={e => setDatasetFields(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Source</label>
                <input style={inputStyle} placeholder="e.g. Kaggle, HuggingFace" value={datasetFields.source} onChange={e => setDatasetFields(p => ({ ...p, source: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Size</label>
                <input style={inputStyle} placeholder="e.g. 14GB, 1M rows" value={datasetFields.size} onChange={e => setDatasetFields(p => ({ ...p, size: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Format</label>
                <input style={inputStyle} placeholder="e.g. CSV, Parquet, JSON" value={datasetFields.format} onChange={e => setDatasetFields(p => ({ ...p, format: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>License</label>
                <input style={inputStyle} placeholder="e.g. CC-BY-4.0, MIT" value={datasetFields.license} onChange={e => setDatasetFields(p => ({ ...p, license: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>URL</label>
                <input style={inputStyle} placeholder="https://..." value={datasetFields.url} onChange={e => setDatasetFields(p => ({ ...p, url: e.target.value }))} />
              </div>
            </div>
          )}

          {activeCategory === 'event' && (
            <div style={fieldGroupStyle}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Event Name *</label>
                <input style={inputStyle} placeholder="e.g. NeurIPS 2026" value={eventFields.title} onChange={e => setEventFields(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input style={inputStyle} type="date" value={eventFields.date} onChange={e => setEventFields(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={eventFields.eventType} onChange={e => setEventFields(p => ({ ...p, eventType: e.target.value }))}>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="webinar">Webinar</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input style={inputStyle} placeholder="e.g. Vancouver, Canada" value={eventFields.location} onChange={e => setEventFields(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input style={inputStyle} placeholder="https://..." value={eventFields.url} onChange={e => setEventFields(p => ({ ...p, url: e.target.value }))} />
              </div>
            </div>
          )}

          {activeCategory === 'article' && (
            <div style={fieldGroupStyle}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Article Title *</label>
                <input style={inputStyle} placeholder="e.g. The Future of Quantum Computing" value={articleFields.title} onChange={e => setArticleFields(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Subtitle</label>
                <input style={inputStyle} placeholder="A brief subtitle..." value={articleFields.subtitle} onChange={e => setArticleFields(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input style={inputStyle} placeholder="https://..." value={articleFields.url} onChange={e => setArticleFields(p => ({ ...p, url: e.target.value }))} />
              </div>
            </div>
          )}

          {imagePreview && (
            <div className="modal-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button className="remove-image-btn" onClick={removeImage}><X size={16} /></button>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Smile size={20} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-toolbar">
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <ImageIcon className="toolbar-icon" size={20} onClick={() => fileInputRef.current.click()} />
            <Video className="toolbar-icon" size={20} />
            <Hash className="toolbar-icon" size={20} />
            <MoreHorizontal className="toolbar-icon" size={20} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {activeCat?.label}
            </span>
            <span style={{ fontSize: 20, color: 'var(--border-color)' }}>|</span>
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={(!content.trim() && !image) || isPosting}
              style={{
                borderRadius: '24px',
                padding: '6px 16px',
                opacity: (!content.trim() && !image) ? 0.5 : 1
              }}
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
