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
  Backdrop
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { toast } from 'react-toastify';
import departmentService from '../../services/departmentService';
import { useAuth } from '../../contexts/AuthContext'; // To get adminRegisterUser function

const ROLES = ['User', 'Planner', 'Admin']; // Define available roles

const RegisterUserForm = ({ onUserRegistered }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '', // Department ID
    role: 'User', // Default role
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { adminRegisterUser } = useAuth(); // This function will be added to AuthContext

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await departmentService.getAllDepartments();
        setDepartments(depts || []);
      } catch (error) {
        toast.error('Failed to load departments. Please try again later.');
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.username.trim()) tempErrors.username = "Username is required.";
    if (!formData.email.trim()) tempErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Email is not valid.";
    if (!formData.password) tempErrors.password = "Password is required.";
    else if (formData.password.length < 6) tempErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match.";
    if (!formData.firstName.trim()) tempErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) tempErrors.lastName = "Last name is required.";
    if (!formData.department) tempErrors.department = "Department is required.";
    if (!formData.role) tempErrors.role = "Role is required.";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const capitalizeName = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      
      const payload = {
        ...registrationData,
        firstName: capitalizeName(registrationData.firstName),
        lastName: capitalizeName(registrationData.lastName),
      };

      const newUser = await adminRegisterUser(payload);
      toast.success(`User "${newUser.username}" registered successfully!`);
      // Reset form
      setFormData({
        username: '', password: '', confirmPassword: '', firstName: '',
        lastName: '', email: '', department: '', role: 'User',
      });
      if (onUserRegistered) {
        onUserRegistered(newUser);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register user.';
      toast.error(errorMessage);
      console.error('Failed to register user:', err);
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Register New User
      </Typography>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField name="firstName" label="First Name" required fullWidth autoComplete="given-name" value={formData.firstName} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} disabled={loading} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="lastName" label="Last Name" required fullWidth autoComplete="family-name" value={formData.lastName} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} disabled={loading} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="username" label="Username" required fullWidth autoComplete="username" value={formData.username} onChange={handleChange} error={!!errors.username} helperText={errors.username} disabled={loading} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="email" label="Email Address" type="email" required fullWidth autoComplete="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} disabled={loading} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="password" label="Password" type="password" required fullWidth autoComplete="new-password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} disabled={loading} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="confirmPassword" label="Confirm Password" type="password" required fullWidth autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} disabled={loading} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.department} disabled={loading}>
              <InputLabel id="department-label">Department</InputLabel>
              <Select labelId="department-label" name="department" value={formData.department} label="Department" sx={{ minWidth: 150 }} onChange={handleChange}>
                <MenuItem value="" disabled><em>Select a department</em></MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                ))}
              </Select>
              {errors.department && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.department}</Typography>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.role} disabled={loading}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select labelId="role-label" name="role" value={formData.role} label="Role"sx={{ minWidth: 150 }} onChange={handleChange}>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
              {errors.role && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.role}</Typography>}
            </FormControl>
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2,minWidth: 300 }} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Register User'}
        </Button>
      </Box>
    </Paper>
  );
};

export default RegisterUserForm;
