import React, { useState } from 'react';
import {
  Button, TextField, Box, Typography, Paper, Grid,
  Select, MenuItem, InputLabel, FormControl, Chip, OutlinedInput
} from '@mui/material';
import { toast } from 'react-toastify';
import { createTaskTemplate } from '../../services/taskTemplateService';
import departmentService from '../../services/departmentService';

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const CreateTaskTemplateForm = ({ onTemplateCreated }) => {
  const [formData, setFormData] = useState({
    order: '',
    name: '',
    defaultResponsible: [],
    defaultPrecedingTasks: '', // Comma-separated string
    defaultLeadTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const fetchedDepartments = await departmentService.getAllDepartments();
        setDepartments(fetchedDepartments || []);
        setDepartmentsError('');
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        const errorMessage = error.message || 'Failed to load departments for selection.';
        setDepartmentsError(errorMessage);
        toast.error(errorMessage);
        setDepartments([]); // Ensure departments is an array even on error
      }
      setDepartmentsLoading(false);
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'order') {
      value = value.toUpperCase();
    } else if (name === 'name') {
      // Apply title case on blur or as they type, for now, let's do it on change
      // For a better UX, title casing might be better onBlur, but this is simpler for now.
      // value = toTitleCase(value);
      // Let's apply title case in handleSubmit to avoid jerky input experience
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

    const templateData = {
      ...formData, // Spread first to get other fields like defaultResponsible
      order: formData.order.toUpperCase().trim(), // Ensure order is uppercase and trimmed
      name: processedName, // Use title-cased name
      defaultLeadTime: Number(formData.defaultLeadTime),
      defaultPrecedingTasks: precedingTasksArray // Use uppercased preceding tasks array
    };

    try {
      const newTemplate = await createTaskTemplate(templateData);
      toast.success(`Task Template '${newTemplate.name}' created successfully!`);

      if (onTemplateCreated) {
        onTemplateCreated();
      }
      
      setFormData({
        order: '',
        name: '',
        defaultResponsible: [],
        defaultPrecedingTasks: '',
        defaultLeadTime: ''
      });
      if (onTemplateCreated) {
        onTemplateCreated(newTemplate);
      }
    } catch (error) {
      console.error('Failed to create task template:', error);
      // The error from the service already includes a user-friendly message
      toast.error(error.message || 'Failed to create task template'); 
    }
    setLoading(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom component="div">
        Create New Task Template
      </Typography>
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
              <InputLabel id="defaultResponsible-label">Responsible Departments</InputLabel>
              <Select
                labelId="defaultResponsible-label"
                id="defaultResponsible"
                multiple
                sx={{ minWidth: 150 }}
                name="defaultResponsible"
                value={formData.defaultResponsible}
                onChange={handleMultiSelectChange}
                input={<OutlinedInput id="select-multiple-chip" label="Default Responsible Departments" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                disabled={departmentsLoading || loading}
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
              label="Lead Time (days)"
              name="defaultLeadTime"
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
              value={formData.defaultLeadTime}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2, minWidth: 300 }}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Task Template'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreateTaskTemplateForm;
