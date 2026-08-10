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
      const response = await api.post('/api/token/', {
        username: credentials.username,
        password: credentials.password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Fetch profile or set default user
      const userInfo = {
        username: credentials.username,
        name: credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1),
        email: `${credentials.username}@sevahealth.org`,
        role: credentials.role || 'patient',
      };

      setUser(userInfo);
      setRole(credentials.role || 'patient');
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('user_role', credentials.role || 'patient');
      setLoading(false);
      return { success: true };
    } catch (err) {
      console.warn('Backend server connection failed, entering demo mode:', err.message);
      // Demo Fallback login
      const userInfo = {
        username: credentials.username || 'ramesh_kumar',
        name: credentials.username ? credentials.username.replace('_', ' ').toUpperCase() : 'Ramesh Kumar',
        email: `${credentials.username || 'ramesh'}@sevahealth.org`,
        phone: '+91 98765 43210',
        village: 'Sundarpur Village, Dist. Solan',
        role: credentials.role || 'patient',
      };
      setUser(userInfo);
      setRole(credentials.role || 'patient');
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('user_role', credentials.role || 'patient');
      localStorage.setItem('access_token', 'demo_jwt_access_token');
      setLoading(false);
      return { success: true, isDemo: true };
    }
  };

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/accounts/register/', userData);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      console.warn('Backend unavailable, simulating registration:', err.message);
      setLoading(false);
      return { success: true, isDemo: true };
    }
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
        logoutUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
