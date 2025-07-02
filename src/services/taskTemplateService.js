import axios from 'axios';
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://10.0.1.221:5000/api';

// Function to get the token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Creates a new task template.
 * @param {object} templateData - The data for the new task template.
 * @returns {Promise<object>} The created task template object.
 */
export const createTaskTemplate = async (templateData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    const response = await axios.post(`${API_URL}/task-templates`, templateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating task template in service:', error.response || error.message);
    // Throw a more specific error message if available from the backend response
    throw new Error(error.response?.data?.message || 'Failed to create task template. Please try again.');
  }
};

/**
 * Fetches task templates. Can optionally include inactive templates.
 * @param {boolean} [includeInactive=false] - Whether to include inactive templates.
 * @returns {Promise<Array<object>>} An array of task template objects.
 */
export const getTaskTemplates = async (includeInactive = false) => {
  const token = getToken();
  if (!token) {
    // This scenario should ideally be handled by a route guard or global error handler
    // For now, let's throw an error, though the UI should prevent calling this if not logged in.
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    let url = `${API_URL}/task-templates`;
    if (includeInactive) {
      url += '?includeInactive=true';
    }
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching task templates in service:', error.response || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch task templates.');
  }
};

/**
 * Fetches a single task template by its ID.
 * @param {string} id - The ID of the task template.
 * @returns {Promise<object>} The task template object.
 */
export const getTaskTemplateById = async (id) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    const response = await axios.get(`${API_URL}/task-templates/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching task template with ID ${id} in service:`, error.response || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch task template details.');
  }
};

/**
 * Updates an existing task template.
 * @param {string} id - The ID of the task template to update.
 * @param {object} templateData - The updated data for the task template.
 * @returns {Promise<object>} The updated task template object.
 */
export const updateTaskTemplate = async (id, templateData) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    const response = await axios.put(`${API_URL}/task-templates/${id}`, templateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating task template with ID ${id} in service:`, error.response || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update task template.');
  }
};

/**
 * Toggles the active status of a task template.
 * @param {string} id - The ID of the task template to toggle.
 * @returns {Promise<object>} The updated task template object.
 */
export const deleteTaskTemplate = async (id) => {
  const response = await api.delete(`/task-templates/${id}`);
  return response.data;
};

export const toggleTaskTemplateActive = async (id) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    const response = await axios.patch(`${API_URL}/task-templates/${id}/toggle-active`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
        // No 'Content-Type' needed for PATCH with empty body if backend doesn't require it
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error toggling active status for task template ID ${id} in service:`, error.response || error.message);
    throw new Error(error.response?.data?.message || 'Failed to toggle task template active status.');
  }
};
