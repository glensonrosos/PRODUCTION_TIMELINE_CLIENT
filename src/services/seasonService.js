import api from './api';

const seasonService = {
  getAllSeasons: async (params = {}) => {
    try {
      // params can include: page, limit, sortBy, sortOrder, search, status
      const response = await api.get('/seasons', { params });
      return response.data; // Returns the full object { seasons, totalSeasons, page, pages }
    } catch (error) {
      console.error('Failed to fetch seasons:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch seasons');
    }
  },

  getSeasonById: async (id) => {
    try {
      const response = await api.get(`/seasons/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to fetch season ${id}`;
      console.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  },
  createSeason: async (seasonData) => {
    try {
      const response = await api.post('/seasons', seasonData);
      return response.data;
    } catch (error) {
      console.error('Failed to create season:', error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to create season');
    }
  },

  updateSeasonDetails: async (seasonId, seasonData) => {
    try {
      const response = await api.put(`/seasons/${seasonId}`, seasonData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update season ${seasonId}:`, error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Server error while updating season.');
    }
  },

  updateTaskInSeason: async (seasonId, taskId, taskData) => {
    try {
      const response = await api.put(`/seasons/${seasonId}/tasks/${taskId}`, taskData);
      return response.data; // Expected to return { message: '...', task: updatedTask }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update task';
      console.error(`Failed to update task ${taskId} in season ${seasonId}:`, errorMessage);
      throw new Error(errorMessage);
    }
  },

  uploadAttachmentForTask: async (seasonId, taskId, formData) => {
    try {
      const response = await api.post(`/seasons/${seasonId}/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data; // Expected to return { message: '...', task: updatedTask }
    } catch (error) {
      console.error(`Failed to upload attachment for task ${taskId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to upload attachment');
    }
  },

  downloadAttachmentForTask: async (seasonId, taskId, attachmentId) => {
    try {
      const response = await api.get(`/seasons/${seasonId}/tasks/${taskId}/attachments/${attachmentId}`, {
        responseType: 'blob',
      });
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'downloaded_file'; // Default filename
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      return { data: response.data, filename };
    } catch (error) {
      console.error(`Failed to download attachment for task ${taskId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to download attachment');
    }
  },

  deleteAttachmentForTask: async (seasonId, taskId, attachmentId) => {
    try {
      const response = await api.delete(`/seasons/${seasonId}/tasks/${taskId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete attachment ${attachmentId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to delete attachment');
    }
  },

  getSeasonLogs: async (seasonId) => {
    try {
      const response = await api.get(`/seasons/${seasonId}/logs`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch logs for season ${seasonId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to fetch season logs');
    }
  },

  exportSeasonToExcel: async (seasonId) => {
    try {
      const response = await api.get(`/seasons/${seasonId}/export`, {
        responseType: 'blob', // Important for file downloads
      });
      return response;
    } catch (error) {
      console.error(`Failed to export season ${seasonId}:`, error);
      throw error;
    }
  },

  updateSeasonStatus: async (seasonId, status) => {
    try {
      const response = await api.put(`/seasons/${seasonId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update status for season ${seasonId}:`, error.response?.data?.message || error.message);
      throw error.response?.data || new Error('Failed to update season status');
    }
  }
}; // Closing brace for seasonService object

export default seasonService;
