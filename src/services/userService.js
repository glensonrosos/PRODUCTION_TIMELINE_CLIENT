import api from './api';

const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch users');
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch user');
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to update user');
    }
  },

  // This function maps to the backend route that deactivates a user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to deactivate user ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to deactivate user');
    }
  },

  changePassword: async (passwordData) => {
    try {
      // The endpoint is POST /api/auth/change-password
      const response = await api.post('/auth/change-password', passwordData);
      return response.data; // Expected to return { message: 'Password changed successfully.' }
    } catch (error) {
      console.error('Failed to change password:', error.response?.data?.message || error.message);
      // Re-throw the error object from the response if available, otherwise a generic error
      // This allows the calling component (ChangePasswordPage) to access specific error messages
      throw error.response?.data || new Error('Failed to change password');
    }
  },

  resetPassword: async (id) => {
    try {
      const response = await api.put(`/users/${id}/reset-password`);
      return response.data; // Expected { message: '...' }
    } catch (error) {
      console.error(`Failed to reset password for user ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to reset password');
    }
  }
};

export default userService;
