import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService';
import departmentService from '../../services/departmentService';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    DialogContentText,
    CircularProgress,
    Backdrop,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Switch,
    FormControlLabel,
    Box
} from '@mui/material';
import { toast } from 'react-toastify';

const EditUserForm = ({ user, open, onClose, onUpdated }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        role: 'User',
        department: '',
        isActive: true,
    });
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const fetchDepartments = useCallback(async () => {
        try {
            const depts = await departmentService.getAllDepartments();
            setDepartments(depts);
        } catch (err) {
            console.error('Failed to fetch departments for edit user form:', err);
            toast.error('Could not load department list.');
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        if (user && open && departments.length > 0) { // Ensure departments are loaded
            const userDepartmentId = user.department?._id || user.department;
            const departmentExists = departments.some(dept => dept._id === userDepartmentId);

            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                username: user.username || '',
                role: user.role || 'User',
                department: departmentExists ? userDepartmentId : '', // Set to '' if not found
                isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
            });
        } else if (user && open) {
            // Departments not loaded yet, set other fields but keep department empty or handle as needed
            setFormData(prev => ({
                ...prev, // Keep existing form data if any
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                username: user.username || '',
                role: user.role || 'User',
                department: '', // Default to empty until departments load
                isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
            }));
        }
        // Only reset error if open state changes, not on every department load
        if (open) {
            setError('');
        }
    }, [user, open, departments]);

    const capitalizeName = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const handleChange = (e) => {
        const targetName = e.target.name;
        const targetType = e.target.type;
        const targetValue = e.target.value; // For text inputs, etc.
        const targetChecked = e.target.checked; // For checkboxes/radios

        // Log details of the event target
        console.log(`handleChange triggered: name='${targetName}', type='${targetType}', value='${targetValue}', checked=${targetChecked}`);

        setFormData(prev => {
            // Log the previous state before this update
            console.log(`setFormData for '${targetName}' - Previous state (prev):`, JSON.parse(JSON.stringify(prev)));
            
            let newCalculatedValue;
            if (targetType === 'checkbox') {
                newCalculatedValue = targetChecked;
            } else {
                newCalculatedValue = targetValue;
            }
            console.log(`setFormData for '${targetName}' - Calculated value to set:`, newCalculatedValue);

            // Construct the new state
            const newState = { ...prev }; // Create a new object from previous state
            newState[targetName] = newCalculatedValue; // Apply the update for the current field
            
            // Log the new state that will be set
            console.log(`setFormData for '${targetName}' - New state (newState) after update:`, JSON.parse(JSON.stringify(newState)));
            
            return newState;
        });
    };

    const handleClose = () => {
        if (onClose) {
            onClose(); // Close the dialog
        }
        // onUpdated is now called directly in handleSubmit after successful API call
        // and before the setTimeout for this handleClose.
        // So, we only need to reset local component state here.
        setSubmitted(false); 
        setError('');
        setLoading(false);
    };

    const handleResetPassword = async () => {
        setIsResetting(true);
        try {
            const response = await userService.resetPassword(user._id);
            toast.success(response.message || 'Password has been reset to "password1234".');
            setConfirmResetOpen(false);
        } catch (err) {
            toast.error(err.message || 'Failed to reset password.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.department) {
            const errorMsg = 'Department is required.';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            console.log('Current formData state before creating payload:', formData); // DEBUGGING formData
            const updatePayload = {
                ...formData,
                firstName: capitalizeName(formData.firstName),
                lastName: capitalizeName(formData.lastName),
                isActive: formData.isActive, // Explicitly ensure isActive is included
            };
            
            const finalPayload = { ...updatePayload, departmentId: updatePayload.department };
            delete finalPayload.department;

            console.log('Submitting User Update Payload:', finalPayload); // DEBUGGING
            await userService.updateUser(user._id, finalPayload);
            toast.success('User updated successfully!');
            setSubmitted(true); // Mark as submitted
            if (onUpdated) { // Call onUpdated immediately to refresh the list
                onUpdated();
            }
            setTimeout(() => {
                handleClose(); // This will now mainly handle closing the dialog
            }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update user.';
            toast.error(errorMessage);
            setError(errorMessage);
            console.error("Update user error:", err);
        } finally {
            // setLoading(false) should be in a finally block if handleSubmit might return early after setLoading(true)
            // However, in the current structure, it's okay here if not returning early from catch.
            // For robustness, especially if more logic is added to catch, finally is better.
            setLoading(false); 
        }
    };

    if (!open) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <DialogTitle>Edit User: {user?.username}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 1 }}>
                    <TextField
                        margin="dense"
                        name="firstName"
                        label="First Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="lastName"
                        label="Last Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        name="username"
                        label="Username"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth margin="dense" sx={{ mb: 2 }} required disabled={loading}>
                        <InputLabel id="role-select-label">Role</InputLabel>
                        <Select
                            labelId="role-select-label"
                            name="role"
                            value={formData.role}
                            label="Role"
                            onChange={handleChange}
                        >
                            <MenuItem value="User">User</MenuItem>
                            <MenuItem value="Planner">Planner</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense" sx={{ mb: 2 }} required disabled={loading} error={!formData.department && !!error}>
                        <InputLabel id="department-select-label">Department</InputLabel>
                        <Select
                            labelId="department-select-label"
                            name="department"
                            value={formData.department}
                            label="Department"
                            onChange={handleChange}
                        >
                            {departments.length === 0 && <MenuItem value="" disabled>Loading departments...</MenuItem>}
                            {departments.map(dept => (
                                <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                            ))}
                        </Select>
                        {!formData.department && !!error && <FormHelperText>{error}</FormHelperText>}
                    </FormControl>
                    <FormControlLabel
                        control={<Switch checked={formData.isActive} onChange={handleChange} name="isActive" />}
                        label="User Active"
                        disabled={loading}
                        sx={{ mt: 1, mb:1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
                    <Button 
                        onClick={() => setConfirmResetOpen(true)} 
                        color="error" 
                        variant="outlined"
                        disabled={loading || isResetting}
                    >
                        Reset Password
                    </Button>
                    <Box>
                        <Button onClick={handleClose} color="inherit" disabled={loading || isResetting}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={loading || isResetting}>
                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>

        {/* Confirmation Dialog for Password Reset */}
        <Dialog
            open={confirmResetOpen}
            onClose={() => setConfirmResetOpen(false)}
        >
            <DialogTitle>Confirm Password Reset</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to reset the password for <strong>{user?.username}</strong> to "password1234"? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmResetOpen(false)} disabled={isResetting}>Cancel</Button>
                <Button onClick={handleResetPassword} color="error" disabled={isResetting}>
                    {isResetting ? <CircularProgress size={24} /> : 'Confirm Reset'}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default EditUserForm;
