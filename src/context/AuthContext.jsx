import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// ─── LocalStorage Helpers ──────────────────────────────────────────────────────

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'graphium_accessToken',
  USER: 'graphium_user',
};

function saveToStorage(accessToken, user) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    // Storage may be unavailable (private browsing, etc.)
  }
}

function loadFromStorage() {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (accessToken && userStr) {
      return { accessToken, user: JSON.parse(userStr) };
    }
  } catch {
    // Corrupted data, ignore
  }
  return null;
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {
    // Ignore
  }
}

// ─── State & Actions ──────────────────────────────────────────────────────────

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_TOKEN':
      return { ...state, accessToken: action.payload };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimerRef = useRef(null);

  // Attach access token to all API requests
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, [state.accessToken]);

  // Persist to localStorage whenever auth state changes
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken && state.user) {
      saveToStorage(state.accessToken, state.user);
    }
  }, [state.isAuthenticated, state.accessToken, state.user]);

  // Auto-refresh access token before expiry
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Refresh 1 minute before the 15-min expiry
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        dispatch({ type: 'UPDATE_TOKEN', payload: newToken });
        // Update token in localStorage too
        try { localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken); } catch {}
        scheduleRefresh();
      } catch {
        clearStorage();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }, 13 * 60 * 1000); // 13 minutes
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // Step 1: Immediately load cached data from localStorage for instant UI
      const cached = loadFromStorage();
      if (cached) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: cached.user, accessToken: cached.accessToken },
        });
      }

      // Step 2: Try to refresh the token from the server (with 5s timeout)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await api.post('/api/auth/refresh', {}, {
          withCredentials: true,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const { accessToken } = res.data;
        const meRes = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: meRes.data.user, accessToken },
        });
        scheduleRefresh();
      } catch {
        // If refresh fails but we have cached data, keep showing it
        if (!cached) {
          clearStorage();
          dispatch({ type: 'AUTH_LOGOUT' });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    restoreSession();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  // ─── Auth Methods ─────────────────────────────────────────────────────────

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password }, { withCredentials: true });
    const { user, accessToken } = res.data;
    saveToStorage(accessToken, user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, accessToken },
    });
    scheduleRefresh();
    return res.data;
  };

  const guestLogin = async () => {
    const res = await api.post('/api/auth/guest', {}, { withCredentials: true });
    const { user, accessToken } = res.data;
    saveToStorage(accessToken, user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, accessToken },
    });
    scheduleRefresh();
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password }, { withCredentials: true });
    const { user, accessToken } = res.data;
    saveToStorage(accessToken, user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, accessToken },
    });
    scheduleRefresh();
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { withCredentials: true });
    } catch {
      // Continue even if backend fails
    }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearStorage();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const oauthLogin = (accessToken, user) => {
    saveToStorage(accessToken, user);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, accessToken },
    });
    scheduleRefresh();
  };

  return (
    <AuthContext.Provider value={{ ...state, login, guestLogin, register, logout, oauthLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
