import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  OutlinedInput,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { toast } from 'react-toastify';
import seasonService from '../../services/seasonService';
import departmentService from '../../services/departmentService';
import taskService from '../../services/taskService';

const CreateTaskForm = ({ onTaskCreated }) => {
  const [formData, setFormData] = useState({
    seasonId: '',
    orderSequence: '',
    taskName: '',
    responsibleDepartmentIds: [],
    precedingTaskIds: [],
    leadTime: '',
    remarks: '',
  });

  const [seasons, setSeasons] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tasksInSeason, setTasksInSeason] = useState([]);
  const [loading, setLoading] = useState({ seasons: false, departments: false, tasks: false, form: false });
  const [errors, setErrors] = useState({});

  // Fetch seasons and departments on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(prev => ({ ...prev, seasons: true, departments: true }));
      try {
        const [seasonsData, departmentsData] = await Promise.all([
          seasonService.getAllSeasons(),
          departmentService.getAllDepartments(),
        ]);
        setSeasons(seasonsData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        toast.error('Failed to load initial form data. Please refresh.');
      }
      setLoading(prev => ({ ...prev, seasons: false, departments: false }));
    };
    fetchInitialData();
  }, []);

  // Fetch tasks when a season is selected
  useEffect(() => {
    if (!formData.seasonId) {
      setTasksInSeason([]);
      setFormData(prev => ({ ...prev, precedingTaskIds: [] })); // Clear preceding tasks if season changes
      return;
    }

    const fetchTasksForSeason = async () => {
      setLoading(prev => ({ ...prev, tasks: true }));
      try {
        const tasksData = await taskService.getTasksBySeason(formData.seasonId);
        setTasksInSeason(tasksData || []);
      } catch (error) {
        toast.error(`Failed to load tasks for the selected season.`);
      }
      setLoading(prev => ({ ...prev, tasks: false }));
    };

    fetchTasksForSeason();
  }, [formData.seasonId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.seasonId) tempErrors.seasonId = "Season is required.";
    if (!formData.orderSequence.toString().trim() || isNaN(formData.orderSequence)) tempErrors.orderSequence = "Order Sequence must be a number.";
    if (!formData.taskName.trim()) tempErrors.taskName = "Task Name is required.";
    if (formData.responsibleDepartmentIds.length === 0) tempErrors.responsibleDepartmentIds = "At least one Responsible Department is required.";
    if (!formData.leadTime.toString().trim() || isNaN(formData.leadTime)) tempErrors.leadTime = "Lead Time must be a number (in days).";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }
    setLoading(prev => ({ ...prev, form: true }));
    try {
      const { seasonId, ...taskData } = formData;
      const newTask = await taskService.createTask(seasonId, taskData);
      toast.success(`Task "${newTask.taskName}" created successfully!`);
      // Reset form
      setFormData({
        seasonId: '', orderSequence: '', taskName: '', responsibleDepartmentIds: [],
        precedingTaskIds: [], leadTime: '', remarks: '',
      });
      setErrors({});
      if (onTaskCreated) {
        onTaskCreated(newTask);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create task.';
      toast.error(errorMessage);
    }
    setLoading(prev => ({ ...prev, form: false }));
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create New Task
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <FormControl fullWidth required error={!!errors.seasonId} disabled={loading.seasons}>
              <InputLabel id="season-select-label">Season</InputLabel>
              <Select
                labelId="season-select-label"
                name="seasonId"
                value={formData.seasonId}
                label="Season"
                onChange={handleChange}
              >
                <MenuItem value="" disabled><em>Select a season...</em></MenuItem>
                {seasons.map((season) => (
                  <MenuItem key={season._id} value={season._id}>{season.seasonName}</MenuItem>
                ))}
              </Select>
              {errors.seasonId && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.seasonId}</Typography>}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="orderSequence" label="Order Sequence" type="number" required fullWidth value={formData.orderSequence} onChange={handleChange} error={!!errors.orderSequence} helperText={errors.orderSequence} disabled={loading.form} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="leadTime" label="Lead Time (Days)" type="number" required fullWidth value={formData.leadTime} onChange={handleChange} error={!!errors.leadTime} helperText={errors.leadTime} disabled={loading.form} />
          </Grid>

          <Grid size={12}>
            <TextField name="taskName" label="Task Name" required fullWidth value={formData.taskName} onChange={handleChange} error={!!errors.taskName} helperText={errors.taskName} disabled={loading.form} />
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth required error={!!errors.responsibleDepartmentIds} disabled={loading.departments || loading.form}>
              <InputLabel id="departments-select-label">Responsible Departments</InputLabel>
              <Select
                labelId="departments-select-label"
                name="responsibleDepartmentIds"
                multiple
                value={formData.responsibleDepartmentIds}
                onChange={handleChange}
                input={<OutlinedInput id="select-multiple-chip" label="Responsible Departments" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const dept = departments.find(d => d._id === value);
                      return <Chip key={value} label={dept ? dept.name : value} />;
                    })}
                  </Box>
                )}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                ))}
              </Select>
              {errors.responsibleDepartmentIds && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.responsibleDepartmentIds}</Typography>}
            </FormControl>
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth disabled={!formData.seasonId || loading.tasks || loading.form}>
              <InputLabel id="preceding-tasks-select-label">Preceding Tasks (Optional)</InputLabel>
              <Select
                labelId="preceding-tasks-select-label"
                name="precedingTaskIds"
                multiple
                value={formData.precedingTaskIds}
                onChange={handleChange}
                input={<OutlinedInput id="select-multiple-preceding" label="Preceding Tasks (Optional)" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const task = tasksInSeason.find(t => t._id === value);
                      return <Chip key={value} label={task ? `${task.orderSequence}. ${task.taskName}` : value} />;
                    })}
                  </Box>
                )}
              >
                {tasksInSeason.length === 0 && <MenuItem disabled><em>No tasks in selected season yet.</em></MenuItem>}
                {tasksInSeason.map((task) => (
                  <MenuItem key={task._id} value={task._id}>{`${task.orderSequence}. ${task.taskName}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <TextField name="remarks" label="Remarks (Optional)" multiline rows={3} fullWidth value={formData.remarks} onChange={handleChange} disabled={loading.form} />
          </Grid>
        </Grid>
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading.form || loading.seasons || loading.departments}>
          {loading.form ? <CircularProgress size={24} /> : 'Create Task'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreateTaskForm;
