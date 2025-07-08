import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, CircularProgress, Alert, Button, Switch, FormControlLabel, Chip
} from '@mui/material';
import { getTaskTemplates, toggleTaskTemplateActive, deleteTaskTemplate } from '../../services/taskTemplateService';
import EditTaskTemplateModal from './EditTaskTemplateModal';
import { toast } from 'react-toastify';

const TaskTemplateList = React.forwardRef((props, ref) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [showInactive, setShowInactive] = useState(false); // Default to false (show only active)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedTemplates = await getTaskTemplates(showInactive);

      // Custom sort for Excel-style order codes (A, B, ..., Z, AA, AB, ...)
      fetchedTemplates.sort((a, b) => {
        const orderA = a.order;
        const orderB = b.order;
        if (orderA.length < orderB.length) return -1;
        if (orderA.length > orderB.length) return 1;
        return orderA.localeCompare(orderB); // Fallback to standard string comparison for same-length codes
      });

      // Apply filtering for active/inactive status
      const filtered = showInactive
        ? fetchedTemplates
        : fetchedTemplates.filter(t => t.isActive);
      setTemplates(filtered);
      setError('');
    } catch (err) {
      console.error('Failed to fetch task templates:', err);
      setError(err.message || 'Failed to load task templates.');
      toast.error(err.message || 'Failed to load task templates.');
    }
    setLoading(false);
  }, [showInactive]); // Add showInactive to dependency array

  // Expose a 'refresh' function to parent components via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchTemplates,
  }));

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]); // Use fetchTemplates in dependency array due to useCallback

  const handleOpenEditModal = (templateId) => {
    setSelectedTemplateId(templateId);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedTemplateId(null);
  };

  const handleTemplateUpdated = (updatedTemplate) => {
    // Refresh the list by re-fetching or updating the specific item
    fetchTemplates(); // Simplest way to refresh
    // Or, for a more optimized update:
    // setTemplates(prevTemplates => 
    //   prevTemplates.map(t => t._id === updatedTemplate._id ? updatedTemplate : t)
    // );
  };

  const handleToggleActiveStatus = async (templateId, currentIsActive) => {
    const action = currentIsActive ? 'Deactivate' : 'Activate';
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this template?`)) {
      return;
    }
    try {
      setLoading(true); // You might want a more specific loading state for this action
      await toggleTaskTemplateActive(templateId);
      toast.success(`Task Template ${action.toLowerCase()}d successfully!`);
      fetchTemplates(); // Refresh the list
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} task template:`, err);
      toast.error(err.message || `Failed to ${action.toLowerCase()} task template.`);
      setLoading(false); // Ensure loading is false on error if it was set true
    }
    setLoading(false); // Ensure loading is false if it was set true and no error, or after try/catch
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to permanently delete this template? This action is only possible if the template is not used in any seasons and cannot be undone.')) {
      return;
    }
    try {
      await deleteTaskTemplate(templateId);
      toast.success('Task Template deleted successfully.');
      fetchTemplates(); // Refresh list and handle loading state
    } catch (err) {
      console.error('Failed to delete task template:', err);
      toast.error(err.response?.data?.message || err.message || 'An error occurred while deleting the template.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Task Templates...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
        <Alert severity="error" sx={{ mt: 2 }}>
            {error}
            <Button onClick={fetchTemplates} size="small" sx={{ ml: 2 }}>Retry</Button>
        </Alert>
    );
  }

  if (templates.length === 0) {
    return <Typography sx={{ mt: 2, p: 2, textAlign: 'center' }}>No task templates found.</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom component="div">
          Existing Task Templates
        </Typography>
        <FormControlLabel
          control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
          label="Show Inactive Templates"
        />
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="task templates table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Order</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Default Responsible</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Preceding Tasks</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Lead Time (Days)</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template._id}>
                <TableCell>{template.order}</TableCell>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.defaultResponsible.join(', ')}</TableCell>
                <TableCell>{template.defaultPrecedingTasks.join(', ')}</TableCell>
                <TableCell>{template.defaultLeadTime}</TableCell>
                <TableCell>
                  <Chip label={template.isActive ? 'Active' : 'Inactive'} color={template.isActive ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenEditModal(template._id)}>Edit</Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color={template.isActive ? 'warning' : 'success'}
                    onClick={() => handleToggleActiveStatus(template._id, template.isActive)}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{ ml: 1 }}
                    onClick={() => handleDeleteTemplate(template._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedTemplateId && (
        <EditTaskTemplateModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          templateId={selectedTemplateId}
          onTemplateUpdated={handleTemplateUpdated}
        />
      )}
    </Box>
  );
});

export default TaskTemplateList;
