import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Key, Shield, Clock, Activity, LogOut, 
  Settings, Eye, Bell, Moon, Globe, ChevronRight, 
  ShieldAlert, Trash2, Check, AlertCircle, Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';

export default function SettingsTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Fetch all settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        setSettings(res.data);
      } catch (err) {
        addToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handlePreferenceUpdate = async (key, value) => {
    try {
      const updatedPrefs = { ...settings.preferences, [key]: value };
      await api.put('/api/settings/preferences', { [key]: value });
      setSettings({ ...settings, preferences: updatedPrefs });
      addToast(`Updated ${key} successfully`);
    } catch (err) {
      addToast(`Failed to update ${key}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ height: '300px' }}>
        <Loader2 className="spinner" size={32} />
        <p>Loading your secure settings...</p>
      </div>
    );
  }

  const accountItems = [
    { label: 'Email', value: settings?.account?.email || user?.email, icon: Mail, action: () => setModalType('email') },
    { label: 'User ID', value: settings?.account?.userId || user?._id?.substring(0, 12) + '...', icon: Key },
    { label: 'Account Type', value: user?.role || 'Researcher', icon: Shield },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown', icon: Clock },
  ];

  return (
    <div className="settings-tab-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-message ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div className="card settings-section-card">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={20} color="var(--accent-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Account Identity</h3>
        </div>
        <div style={{ padding: '8px' }}>
          {accountItems.map((item, idx) => (
            <div key={idx} className="settings-row" onClick={item.action} style={{ cursor: item.action ? 'pointer' : 'default' }}>
              <div className="settings-icon-wrapper">
                <item.icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.value}</div>
              </div>
              {item.action && <ChevronRight size={16} color="var(--text-tertiary)" />}
            </div>
          ))}
          <div className="settings-row" onClick={() => setModalType('password')} style={{ cursor: 'pointer' }}>
             <div className="settings-icon-wrapper"><Key size={18} /></div>
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Password</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Change your security credentials</div>
             </div>
             <ChevronRight size={16} color="var(--text-tertiary)" />
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="card settings-section-card">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="var(--accent-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Activity & Security</h3>
        </div>
        <div style={{ padding: '8px' }}>
           <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/history')}>
              <div className="settings-icon-wrapper"><Clock size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Activity History</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Review your login and research logs</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
           </div>
           <div className="settings-row">
              <div className="settings-icon-wrapper"><LogOut size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Last Login Session</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current Session'}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card settings-section-card">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={20} color="var(--accent-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Personalization</h3>
        </div>
        <div style={{ padding: '8px' }}>
          {/* Visibility Toggle */}
          <div className="settings-row">
            <div className="settings-icon-wrapper"><Eye size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Profile Visibility</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Control who can see your research profile</div>
            </div>
            <label className="premium-switch">
              <input 
                type="checkbox" 
                checked={settings?.preferences?.visibility === 'public'} 
                onChange={(e) => handlePreferenceUpdate('visibility', e.target.checked ? 'public' : 'private')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Notifications Toggle */}
          <div className="settings-row">
            <div className="settings-icon-wrapper"><Bell size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Smart Notifications</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Email alerts for new grants and citations</div>
            </div>
            <label className="premium-switch">
              <input 
                type="checkbox" 
                checked={settings?.preferences?.notifications === 'enabled'} 
                onChange={(e) => handlePreferenceUpdate('notifications', e.target.checked ? 'enabled' : 'disabled')}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          {/* Theme Selector */}
          <div className="settings-row">
            <div className="settings-icon-wrapper"><Moon size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Interface Theme</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Choose your preferred reading experience</div>
            </div>
            <select 
              className="settings-select"
              value={settings?.preferences?.theme || 'light'}
              onChange={(e) => handlePreferenceUpdate('theme', e.target.value)}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">System Default</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="settings-row">
            <div className="settings-icon-wrapper"><Globe size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Research Language</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Preferred language for interface and news</div>
            </div>
            <select 
              className="settings-select"
              value={settings?.preferences?.language || 'en'}
              onChange={(e) => handlePreferenceUpdate('language', e.target.value)}
            >
              <option value="en">English (US)</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone-card">
        <h3 className="danger-title"><ShieldAlert size={20} /> Danger Zone</h3>
        <p style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '16px' }}>
          Deleting or deactivating your account is permanent. This will remove access to all your private research labs.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={logout}
            className="btn-secondary" 
            style={{ flex: 1, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
          <button 
            onClick={() => setModalType('deactivate')}
            className="btn-secondary" 
            style={{ flex: 1, borderRadius: '10px', borderColor: '#fecaca', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Trash2 size={16} /> Deactivate Account
          </button>
        </div>
      </div>

      {/* Development Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Graphium Secure Core — End-to-End Encrypted
      </div>

      {/* Modals */}
      {modalType && (
        <SettingsModal 
          type={modalType} 
          onClose={() => setModalType(null)} 
          onSuccess={(msg) => {
            addToast(msg);
            if (modalType === 'deactivate') {
              setTimeout(() => logout(), 2000);
            }
          }}
        />
      )}
    </div>
  );
}
