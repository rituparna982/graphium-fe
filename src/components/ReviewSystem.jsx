import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Star, MessageSquare, Send, User } from 'lucide-react';

export default function ReviewSystem({ targetId }) {
  const [reviews, setReviews] = useState([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetId) {
      api.get(`/api/reviews/${targetId}`).then(res => {
        setReviews(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [targetId]);

  const submitReview = async () => {
    if (!content.trim()) return;
    try {
      const res = await api.post('/api/reviews', { targetId, content, rating });
      setReviews(prev => [res.data, ...prev]);
      setContent('');
      setRating(5);
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  return (
    <div className="review-system card" style={{ padding: 24, marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
        <Star style={{ verticalAlign: -3, marginRight: 8 }} /> Peer Reviews
      </h2>

      {/* Review input */}
      <div style={{ marginBottom: 30, background: '#f8fafc', padding: 20, borderRadius: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Submit Your Review</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star} 
              size={20} 
              fill={rating >= star ? '#f59e0b' : 'none'} 
              color={rating >= star ? '#f59e0b' : '#94a3b8'} 
              style={{ cursor: 'pointer' }}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
        <textarea 
          placeholder="Write an authentic scientific review..." 
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100, marginBottom: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={submitReview} disabled={!content.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={16} /> Submit Review
          </button>
        </div>
      </div>

      {/* Review list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>No peer reviews yet. Be the first to review this work!</p>
        ) : reviews.map((rev, i) => (
          <div key={i} style={{ borderBottom: i < reviews.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="me-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{rev.reviewerId?.name?.charAt(0) || 'R'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{rev.reviewerId?.name || 'Researcher'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Peer Reviewer • {new Date(rev.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(star => (
                   <Star key={star} size={14} fill={rev.rating >= star ? '#f59e0b' : 'none'} color={rev.rating >= star ? '#f59e0b' : '#94a3b8'} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{rev.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
