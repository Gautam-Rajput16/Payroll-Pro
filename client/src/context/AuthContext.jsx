import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user on app start if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const role = storedUser?.role || 'admin'; // default to admin for this system

        let endpoint = '/admin/auth/me';
        if (role === 'superadmin') {
          endpoint = '/superadmin/auth/me';
        } else if (role === 'employee') {
          endpoint = '/employee/auth/me';
        }

        const res = await axiosInstance.get(endpoint);
        setUser(res.data.data);
        setIsAuthenticated(true);
        setIsFirstLogin(res.data.data.isFirstLogin || false);
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        logout(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      // The requirement focuses on ADMIN, so we use admin login by default.
      const res = await axiosInstance.post('/admin/auth/login', { email, password });
      
      const { token: newToken, user: userData } = res.data.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      setIsFirstLogin(userData.isFirstLogin || false);
      
      toast.success(res.data.message || 'Logged in successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = (showToast = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsFirstLogin(false);
    if(showToast) {
       toast.success('Logged out successfully');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.patch('/admin/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setIsFirstLogin(false);
      
      // Update user in state/localStorage
      if (user) {
        const updatedUser = { ...user, isFirstLogin: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isFirstLogin,
        loading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
