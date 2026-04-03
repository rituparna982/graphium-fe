import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Home, Users, BookOpen, Microscope, Calendar, MessageSquare, Bell, ChevronDown, LogOut, Clock, Settings } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import logo from './assets/logo.png';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Network from './pages/Network';
import Publication from './pages/Publication';
import Labs from './pages/Labs';
import Conferences from './pages/Conferences';
import Messaging from './pages/Messaging';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import Scholar from './pages/Scholar';
import UserProfile from './pages/UserProfile';
import History from './pages/History';
import SettingsPage from './pages/Settings';

import React, { useState, useEffect, useRef } from 'react';
import api from './api/axios';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 2) {
        fetchResults(searchTerm);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchResults = async (q) => {
    setIsSearching(true);
    try {
      const res = await api.get(`/api/scholar/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.organic_results?.slice(0, 5) || []);
      setShowResults(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setShowResults(false);
      navigate(`/scholar?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleResultClick = (query) => {
    setSearchTerm(query);
    setShowResults(false);
    navigate(`/scholar?q=${encodeURIComponent(query)}`);
  };

  // Don't show navbar on auth pages
  const isAuthPage = ['/login', '/register', '/oauth-callback'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && (
        <nav className="global-nav">
          <div className="global-nav-container">
            <div className="global-nav-brand">
              <Link to="/" className="logo-box">
                <img src={logo} alt="Graphium" className="app-logo" />
              </Link>
              <div className="search-box" ref={searchRef}>
                <Search className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search papers, researchers, grants..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  onFocus={() => searchTerm.length > 2 && setShowResults(true)}
                />
                
                {showResults && (
                  <div className="search-dropdown">
                    {isSearching ? (
                      <div className="search-dropdown-message">Searching Scholar...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result, idx) => (
                        <div key={idx} className="search-dropdown-item" onClick={() => {
                          window.open(result.link, '_blank');
                          setShowResults(false);
                        }}>
                          <div className="search-dropdown-title">{result.title}</div>
                          <div className="search-dropdown-meta">{result.publication_info?.summary}</div>
                        </div>
                      ))
                    ) : (
                      <div className="search-dropdown-message">No results found</div>
                    )}
                    <div className="search-dropdown-footer" onClick={() => handleGlobalSearch({ key: 'Enter', searchTerm })}>
                      See all results for "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="global-nav-nav" style={{ display: 'flex' }}>
              <Link to="/" className={`nav-item ${isActive('/')}`}>
                <Home />
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/community" className={`nav-item ${isActive('/community')}`}>
                <Users />
                <span className="nav-text">Collaborators</span>
              </Link>
              <Link to="/scholar" className={`nav-item ${isActive('/scholar')}`}>
                <BookOpen />
                <span className="nav-text">Scholar</span>
              </Link>
              <Link to="/labs" className={`nav-item ${isActive('/labs')}`}>
                <Microscope />
                <span className="nav-text">Labs & Grants</span>
              </Link>
              <Link to="/conferences" className={`nav-item ${isActive('/conferences')}`}>
                <Calendar />
                <span className="nav-text">Conferences</span>
              </Link>
              <Link to="/messaging" className={`nav-item ${isActive('/messaging')}`}>
                <MessageSquare />
                <span className="nav-text">Messaging</span>
              </Link>
              <Link to="/notifications" className={`nav-item ${isActive('/notifications')}`}>
                <Bell />
                <span className="nav-text">Notifications</span>
              </Link>
              <Link to="/history" className={`nav-item ${isActive('/history')}`}>
                <Clock />
                <span className="nav-text">History</span>
              </Link>
              <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
                <Settings />
                <span className="nav-text">Settings</span>
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className={`nav-item me-nav-item ${isActive('/profile')}`}>
                    <div className="me-avatar">{user?.name?.charAt(0) || 'U'}</div>
                    <span className="nav-text">Me <ChevronDown style={{width: 12, height: 12, marginLeft: 2}}/></span>
                  </Link>
                  <button className="nav-item" onClick={logout} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span className="nav-text">Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className={`nav-item ${isActive('/login')}`}>
                  <div className="me-avatar">?</div>
                  <span className="nav-text">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      <main className={isAuthPage ? '' : 'main-container'} id="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Network /></ProtectedRoute>} />
          <Route path="/publications" element={<ProtectedRoute><Publication /></ProtectedRoute>} />
          <Route path="/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
          <Route path="/conferences" element={<ProtectedRoute><Conferences /></ProtectedRoute>} />
          <Route path="/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/scholar" element={<ProtectedRoute><Scholar /></ProtectedRoute>} />
          <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}
