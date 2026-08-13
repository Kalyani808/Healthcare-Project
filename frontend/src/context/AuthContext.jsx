import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('user_role') || 'patient';
  });
  const [loading, setLoading] = useState(false);

  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      // Attempt backend JWT login
      const response = await api.post('/api/auth/login/', {
        username: credentials.username,
        password: credentials.password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Fetch profile from backend
      let userInfo = {
        username: credentials.username,
        name: credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1),
        email: `${credentials.username}@sevahealth.org`,
        role: credentials.role || 'patient',
      };

      try {
        const profileRes = await api.get('/api/auth/profile/');
        if (profileRes.data) {
          userInfo = {
            ...userInfo,
            ...profileRes.data,
            name: profileRes.data.full_name || profileRes.data.user || userInfo.name,
          };
        }
      } catch (pErr) {
        console.warn('Profile fetch error:', pErr);
      }

      setUser(userInfo);
      setRole(credentials.role || 'patient');
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('user_role', credentials.role || 'patient');
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Backend login failed:', err);
      setLoading(false);
      return { success: false, error: err.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const payload = {
        username: userData.username,
        password: userData.password,
        email: userData.email || '',
        role: userData.role || 'patient',
        phone_number: userData.phone || userData.phone_number || '',
      };
      const response = await api.post('/api/auth/register/', payload);
      if (response.data?.access) {
        localStorage.setItem('access_token', response.data.access);
      }
      if (response.data?.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Backend registration failed:', err);
      setLoading(false);
      return { success: false, error: err.response?.data ? JSON.stringify(err.response.data) : 'Registration failed' };
    }
  };

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      if (newUserData.first_name || newUserData.username) {
        updated.name = newUserData.first_name || newUserData.username || prev?.name;
      }
      localStorage.setItem('user_info', JSON.stringify(updated));
      return updated;
    });
  };

  const logoutUser = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_role');
    setUser(null);
    setRole('patient');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginUser,
        registerUser,
        updateUser,
        logoutUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
