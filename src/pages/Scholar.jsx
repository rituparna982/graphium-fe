import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, ExternalLink, Share2, Plus, Loader2, AlertCircle, PenSquare } from 'lucide-react';
import PostModal from '../components/PostModal';

export default function Scholar() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setIsMock(false);
    try {
      const res = await api.get(`/api/scholar/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data.organic_results || []);
      if (res.data.is_mock) setIsMock(true);
    } catch (err) {
      setError("Failed to fetch results. Please ensure SERPAPI_KEY is configured.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleImport = async (paper) => {
    try {
      // In a real app, this would save to the user's publications
      alert(`Imported: ${paper.title}`);
    } catch (err) {
      alert("Import failed.");
    }
  };

  const handleShare = async (paper) => {
    try {
      await api.post('/api/posts', {
        content: `I found this interesting paper on Google Scholar: ${paper.title}`,
        action: 'shared a paper',
        target: 'Google Scholar',
        attachment: {
          title: paper.title,
          type: 'Publication',
          desc: paper.snippet
        }
      });
      alert("Shared to your feed!");
    } catch (err) {
      alert("Failed to share.");
    }
  };

  return (
    <div className="scholar-layout">
      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onPostSuccess={() => setIsModalOpen(false)}
      />
      <button
        onClick={() => setIsModalOpen(true)}
        style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
        className="btn-primary"
        title="Create a post"
      >
        <PenSquare size={22} />
      </button>
      {isMock && (
        <div className="card" style={{ 
          background: '#fff9db', 
          border: '1px solid #fab005', 
          marginBottom: 16, 
          padding: '12px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          color: '#856404',
          borderRadius: '8px'
        }}>
          <AlertCircle size={20} />
          <div style={{ fontSize: 14 }}>
            <strong>Demo Mode:</strong> Showing simulated results. Please add <code>SERPAPI_KEY</code> to your backend <code>.env</code> file for live Google Scholar integration.
          </div>
        </div>
      )}
      <div className="card scholar-search-header">
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Google Scholar Integration</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Search for real-world publications, citations, and researcher data.</p>
        
        <form onSubmit={handleSearch} className="scholar-search-form">
          <div className="search-box" style={{ width: '100%', height: 56, fontSize: 18 }}>
            <Search className="search-icon" size={24} />
            <input 
              type="text" 
              placeholder="Search by title, author, or DOI..." 
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ height: 40, marginRight: 8 }}>Search</button>
          </div>
        </form>
      </div>

      <div className="scholar-results">
        {loading && (
          <div className="loading-state" style={{ padding: 40 }}>
            <Loader2 className="animate-spin" size={32} />
            <p>Fetching data from Google Scholar...</p>
          </div>
        )}

        {error && <div className="error-card">{error}</div>}

        {!loading && results.length > 0 && (
          <div className="results-list">
            {results.map((item, index) => (
              <div key={index} className="card result-item interactive" style={{ marginBottom: 16, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-color)', marginBottom: 8 }}>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {item.title} <ExternalLink size={14} />
                      </a>
                    </h3>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {item.publication_info?.summary}
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)' }}>{item.snippet}</p>
                  </div>
                  <div className="result-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 24 }}>
                    <button className="btn-secondary" onClick={() => handleImport(item)} style={{ fontSize: 13, gap: 4 }}>
                      <Plus size={14} /> Import
                    </button>
                    <button className="btn-secondary" onClick={() => handleShare(item)} style={{ fontSize: 13, gap: 4 }}>
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="empty-state">No results found for "{query}".</div>
        )}
      </div>
    </div>
  );
}
