import api from './api';

const departmentService = {
  getAllDepartments: async () => {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch departments:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch departments');
    }
  },

  createDepartment: async (departmentData) => {
    try {
      const response = await api.post('/departments', departmentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create department:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to create department');
    }
  },

  updateDepartment: async (id, departmentData) => {
    try {
      const response = await api.put(`/departments/${id}`, departmentData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update department ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to update department');
    }
  },

  deleteDepartment: async (id) => {
    try {
      const response = await api.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete department ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to delete department');
    }
  },
};

export default departmentService;
