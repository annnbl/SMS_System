import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, setRefreshToken, removeTokens } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('brightloop_user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.warn('Auth check failed:', err.message);
        removeTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      setAuthToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      setUser(res.data.user);
      localStorage.setItem('brightloop_user', JSON.stringify(res.data.user));
    }
    return res;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.success && res.data) {
      setAuthToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      setUser(res.data.user);
      localStorage.setItem('brightloop_user', JSON.stringify(res.data.user));
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      removeTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
