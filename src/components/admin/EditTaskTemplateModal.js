import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Box, Typography, Grid, Dialog, DialogActions,
  DialogContent, DialogTitle, CircularProgress, Alert,
  Select, MenuItem, InputLabel, FormControl, Chip, OutlinedInput
} from '@mui/material';
import { toast } from 'react-toastify';
import { getTaskTemplateById, updateTaskTemplate } from '../../services/taskTemplateService';
import departmentService from '../../services/departmentService'; // Import departmentService

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};


const EditTaskTemplateModal = ({ open, onClose, templateId, onTemplateUpdated }) => {
  const [formData, setFormData] = useState({
    order: '',
    name: '',
    defaultResponsible: [],
    defaultPrecedingTasks: '', // Comma-separated string
    defaultLeadTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageLoading, setPageLoading] = useState(false); // For loading template details
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      if (open && templateId) {
        setPageLoading(true);
        setFormError('');
        try {
          // Fetch departments
          setDepartmentsLoading(true);
          const fetchedDepartments = await departmentService.getAllDepartments();
          setDepartments(fetchedDepartments || []);
          setDepartmentsError('');
          setDepartmentsLoading(false);

          // Fetch template details
          const template = await getTaskTemplateById(templateId);
          setFormData({
            order: template.order || '',
            name: template.name || '',
            defaultResponsible: template.defaultResponsible || [],
            defaultPrecedingTasks: (template.defaultPrecedingTasks || []).join(', '),
            defaultLeadTime: template.defaultLeadTime?.toString() || ''
          });
        } catch (error) {
          console.error('Failed to fetch initial data for edit modal:', error);
          const errorMessage = error.message || 'Failed to load data for editing.';
          setFormError(errorMessage);
          toast.error(errorMessage);
          if (!departments.length) setDepartments([]); // Ensure array if dept fetch failed earlier
        }
        setPageLoading(false);
      } else if (!open) {
        // Reset departments loading state as well when modal closes
        setDepartmentsLoading(true); 
      }
    };

    fetchInitialData();

    // Reset form when modal is closed or templateId changes (if not loading)
    if (!open) {
      setFormData({
        order: '',
        name: '',
        defaultResponsible: [],
        defaultPrecedingTasks: '',
        defaultLeadTime: ''
      });
      setFormError('');
    }
  }, [open, templateId]);


  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'order') {
      value = value.toUpperCase();
    } else if (name === 'name') {
      // Title case for name will be handled in handleSubmit
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelectChange = (event) => {
    const { target: { value } } = event;
    setFormData(prev => ({
        ...prev,
        defaultResponsible: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    if (!formData.order || !formData.name || formData.defaultResponsible.length === 0 || !formData.defaultLeadTime) {
        toast.error('Please fill in all required fields: Order, Name, Default Responsible, and Default Lead Time.');
        setLoading(false);
        return;
    }
    if (isNaN(formData.defaultLeadTime) || Number(formData.defaultLeadTime) < 1) {
        toast.error('Default Lead Time must be a number greater than or equal to 1.');
        setLoading(false);
        return;
    }

    // Capitalize template name (Title Case)
    const processedName = toTitleCase(formData.name.trim());

    // Capitalize preceding tasks
    const precedingTasksArray = formData.defaultPrecedingTasks
      .toUpperCase() // Uppercase the whole string first
      .split(',')
      .map(task => task.trim())
      .filter(task => task !== '');

    const templateUpdateData = {
      // Explicitly set all fields to ensure transformations are applied
      order: formData.order.toUpperCase().trim(),
      name: processedName,
      defaultResponsible: formData.defaultResponsible, // This comes directly from state
      defaultLeadTime: Number(formData.defaultLeadTime),
      defaultPrecedingTasks: precedingTasksArray,
      // Include any other fields from formData that should be passed through directly
      // For example, if there were an _id or other non-transformed fields:
      // _id: formData._id, // (If applicable, though usually not sent in update payload like this)
    };

    try {
      const updatedTemplate = await updateTaskTemplate(templateId, templateUpdateData);
      toast.success(`Task Template '${updatedTemplate.name}' updated successfully!`);
      if (onTemplateUpdated) {
        onTemplateUpdated(updatedTemplate);
      }
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Failed to update task template:', error);
      setFormError(error.message || 'Failed to update task template.');
      toast.error(error.message || 'Failed to update task template.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Task Template</DialogTitle>
      <DialogContent>
        {pageLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Template Details...</Typography>
          </Box>
        ) : formError && !pageLoading ? (
            <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="order"
                  label="Order Code (e.g., A, B, AA) - ALL CAPS"
                  name="order"
                  autoComplete="off"
                  value={formData.order}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Template Name (e.g., Initial Sample Review)"
                  name="name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required disabled={loading}>
                  <InputLabel id="defaultResponsible-label">Default Responsible Departments</InputLabel>
                  <Select
                    labelId="defaultResponsible-label"
                    id="defaultResponsible"
                    multiple
                    name="defaultResponsible"
                    value={formData.defaultResponsible}
                    onChange={handleMultiSelectChange}
                    input={<OutlinedInput id="select-multiple-chip-edit" label="Default Responsible Departments" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    disabled={departmentsLoading || loading || pageLoading}
                  >
                    {departmentsLoading ? (
                      <MenuItem disabled><em>Loading departments...</em></MenuItem>
                    ) : departmentsError ? (
                      <MenuItem disabled><em>{departmentsError}</em></MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem disabled><em>No departments found. Please create departments first.</em></MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="defaultPrecedingTasks"
                  label="Preceding Tasks (Order Codes, comma-separated) - ALL CAPS"
                  name="defaultPrecedingTasks"
                  autoComplete="off"
                  value={formData.defaultPrecedingTasks}
                  onChange={handleChange}
                  disabled={loading}
                  helperText="e.g., A, B, C"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="defaultLeadTime"
                  label="Default Lead Time (days)"
                  name="defaultLeadTime"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={formData.defaultLeadTime}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
            </Grid>
            {formError && !pageLoading && <Alert severity="error" sx={{ mt: 2, mb:1 }}>{formError}</Alert>}
            <DialogActions sx={{pt:2}}>
              <Button onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading || pageLoading}>
                {loading ? 'Updating...' : 'Update Template'}
              </Button>
            </DialogActions>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskTemplateModal;
