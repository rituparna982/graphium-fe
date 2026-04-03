import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Monitor, User, Mail, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, login } = useAuth();
  
  const [profileInfo, setProfileInfo] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      // Update profile in backend
      const res = await api.put('/api/profile', {
        name: profileInfo.name,
        about: profileInfo.bio
      });
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      // Note: Re-fetching user info or updating context might be needed if user name changed
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match' });
    }
    
    setLoading(true);
    try {
      await api.put('/api/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="section-title">
        <Monitor size={24} />
        Settings
      </div>

      {status.message && (
        <div className={`status-msg ${status.type}`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      <div className="settings-grid">
        {/* Appearance Section */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <h3>Appearance</h3>
            <p>Customize how Graphium looks for you.</p>
          </div>
          <div className="theme-selector">
            <button 
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              <Sun size={20} />
              <span>Light</span>
            </button>
            <button 
              className={`theme-btn ${theme === 'default' ? 'active' : ''}`}
              onClick={() => toggleTheme('default')}
            >
              <Monitor size={20} />
              <span>Default (Grey)</span>
            </button>
            <button 
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              <Moon size={20} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <h3>Profile Information</h3>
            <p>Update your public information.</p>
          </div>
          <form onSubmit={handleProfileUpdate} className="settings-form">
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={profileInfo.name}
                  onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                  placeholder="Your Name"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Biography</label>
              <div className="input-wrapper textarea-wrapper">
                <textarea 
                  value={profileInfo.bio}
                  onChange={(e) => setProfileInfo({...profileInfo, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Account Security Section */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <h3>Account Security</h3>
            <p>Manage your account credentials.</p>
          </div>
          <form onSubmit={handlePasswordUpdate} className="settings-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper disabled">
                <Mail size={18} className="input-icon" />
                <input type="email" value={profileInfo.email} readOnly />
              </div>
            </div>
            <div className="input-group">
              <label>Current Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="input-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Lock size={18} />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
      
      <style>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .status-msg {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .status-msg.success {
          background: #ecfdf5;
          color: #10b981;
          border: 1px solid #d1fae5;
        }
        .status-msg.error {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
        }
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-card {
          padding: 32px;
        }
        .settings-card-header {
          margin-bottom: 24px;
        }
        .settings-card-header h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text-primary);
        }
        .settings-card-header p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .theme-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }
        .theme-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          border-radius: 16px;
          background: var(--bg-primary);
          border: 2px solid transparent;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .theme-btn:hover {
          background: var(--bg-tertiary);
          transform: translateY(-2px);
        }
        .theme-btn.active {
          border-color: var(--accent-color);
          background: var(--accent-light);
          color: var(--accent-color);
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .textarea-wrapper {
          height: auto !important;
          padding: 12px 14px !important;
        }
        .textarea-wrapper textarea {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 15px;
          color: var(--text-primary);
          resize: vertical;
        }
        .input-wrapper.disabled {
          background: var(--bg-tertiary);
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
