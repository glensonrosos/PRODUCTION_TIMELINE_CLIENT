import api from './api';

const buyerService = {
  getAllBuyers: async () => {
    try {
      const response = await api.get('/buyers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch buyers:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch buyers');
    }
  },

  createBuyer: async (buyerData) => {
    try {
      const response = await api.post('/buyers', buyerData);
      return response.data;
    } catch (error) {
      console.error('Failed to create buyer:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to create buyer');
    }
  },

  updateBuyer: async (id, buyerData) => {
    try {
      const response = await api.put(`/buyers/${id}`, buyerData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update buyer ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to update buyer');
    }
  },

  deleteBuyer: async (id) => {
    try {
      const response = await api.delete(`/buyers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete buyer ${id}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to delete buyer');
    }
  },
};

export default buyerService;
