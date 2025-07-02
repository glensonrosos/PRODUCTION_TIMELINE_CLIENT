import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { toast } from 'react-toastify';
import departmentService from '../../services/departmentService'; // Corrected import

const CreateDepartmentForm = ({ onDepartmentCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newDepartment = await departmentService.createDepartment({ name });
      toast.success(`Department "${newDepartment.name}" created successfully!`);
      setName(''); // Reset form
      if (onDepartmentCreated) {
        onDepartmentCreated(newDepartment); // Callback for parent component if needed
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create department.';
      toast.error(errorMessage);
      setError(errorMessage);
      console.error('Failed to create department:', err);
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create New Department
      </Typography>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="departmentName"
          label="Department Name"
          name="departmentName"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(''); // Clear error when user types
          }}
          error={!!error}
          helperText={error}
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || !name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Department'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreateDepartmentForm;
