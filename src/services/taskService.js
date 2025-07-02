import api from './api';

const taskService = {
  createTask: async (seasonId, taskData) => {
    try {
      const response = await api.post(`/seasons/${seasonId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Failed to create task for season ${seasonId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to create task');
    }
  },

  getTasksBySeason: async (seasonId) => {
    try {
      const response = await api.get(`/seasons/${seasonId}/tasks`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch tasks for season ${seasonId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch tasks');
    }
  },
};

export default taskService;
