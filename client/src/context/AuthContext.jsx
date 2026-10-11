import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wayfare_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('wayfare_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify stored token on startup
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('wayfare_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setCurrentUser(res.data.data);
          localStorage.setItem('wayfare_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.removeItem('wayfare_token');
        localStorage.removeItem('wayfare_user');
        setCurrentUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token: receivedToken } = res.data.data;
      setCurrentUser(user);
      setToken(receivedToken);
      localStorage.setItem('wayfare_token', receivedToken);
      localStorage.setItem('wayfare_user', JSON.stringify(user));
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user, token: receivedToken } = res.data.data;
      setCurrentUser(user);
      setToken(receivedToken);
      localStorage.setItem('wayfare_token', receivedToken);
      localStorage.setItem('wayfare_user', JSON.stringify(user));
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const adminLogin = async (usernameOrEmail, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/admin-login', {
        email: usernameOrEmail,
        password,
      });
      const { user, token: receivedToken } = res.data.data;
      setCurrentUser(user);
      setToken(receivedToken);
      localStorage.setItem('wayfare_token', receivedToken);
      localStorage.setItem('wayfare_user', JSON.stringify(user));
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Admin authentication failed. Access strictly restricted.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('wayfare_token');
    localStorage.removeItem('wayfare_user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        error,
        login,
        adminLogin,
        register,
        logout,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
