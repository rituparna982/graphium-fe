import React, { useState } from 'react';
import { X, Lock, Mail, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function SettingsModal({ type, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const titles = {
    email: 'Update Email Address',
    password: 'Change Password',
    deactivate: 'Deactivate Account'
  };

  const descriptions = {
    email: 'Enter your new email address and confirm with your current password.',
    password: 'Choose a strong password with at least 6 characters.',
    deactivate: 'This will temporarily disable your account. You can reactivate it later by logging back in.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'email') {
        await api.put('/api/settings/email', {
          email: formData.email,
          password: formData.currentPassword
        });
        onSuccess('Email updated successfully!');
      } else if (type === 'password') {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        await api.put('/api/settings/password', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        onSuccess('Password changed successfully!');
      } else if (type === 'deactivate') {
        await api.delete('/api/settings/account', {
          data: { password: formData.currentPassword }
        });
        onSuccess('Account deactivated. Logging out...');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{titles[type]}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{descriptions[type]}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '8px', color: '#be123c', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {type === 'email' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>New Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                  <input
                    type="email"
                    required
                    className="settings-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            )}

            {type === 'password' && (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="settings-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="At least 6 characters"
                      value={formData.newPassword}
                      onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                    <input
                      type="password"
                      required
                      className="settings-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="Repeat new password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                {type === 'deactivate' ? 'Confirm your password to deactivate' : 'Current Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  required
                  className="settings-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={type === 'deactivate' ? 'btn-danger' : 'btn-primary'}
              style={{ 
                flex: 1, 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                background: type === 'deactivate' ? '#ef4444' : 'var(--accent-color)',
                color: 'white'
              }}
            >
              {loading ? <Loader2 size={18} className="spinner" /> : (type === 'deactivate' ? 'Deactivate' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        .btn-danger:hover {
          background: #dc2626 !important;
        }
      `}</style>
    </div>
  );
}
