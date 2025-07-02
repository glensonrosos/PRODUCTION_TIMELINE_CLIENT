import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Corrected import name

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedUser.exp < currentTime) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decodedUser); 
          // Optionally, set the token in api headers again if page reloads
          // and api instance is re-created without the interceptor immediately active
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // The backend expects the field to be `usernameOrEmail`
      const response = await api.post('/auth/login', { usernameOrEmail: username, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const adminRegisterUser = async (userData) => {
    try {
      // Backend /auth/register is already protected and expects admin privileges
      const response = await api.post('/auth/register', userData);
      // The response might contain the newly created user object or a success message
      // For now, let's assume it returns the new user, which can be useful for UI updates
      return response.data; // Or response.data.user if the user object is nested
    } catch (error) {
      console.error('Admin user registration failed:', error.response?.data?.message || error.message);
      // Re-throw the error to be caught by the calling component (RegisterUserForm)
      // This allows the form to display specific error messages from the backend
      throw error.response?.data || new Error('Admin user registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    adminRegisterUser, // Added adminRegisterUser
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
