import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService'; // To be created/updated
import { 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemSecondaryAction, 
    IconButton, 
    Paper, 
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Chip,
    Tooltip,
    Box // Added Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import EditUserForm from './EditUserForm'; // Import EditUserForm

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [editingUser, setEditingUser] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users.');
            console.error("Fetch users error:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditClick = (user) => {
        setEditingUser(user);
        setOpenEditDialog(true);
        setError('');
        setSuccessMessage('');
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
        setEditingUser(null);
    };

    const handleUserUpdated = () => {
        fetchUsers(); // Refresh the list after an update
        setSuccessMessage('User details updated successfully.'); // Optionally show success here or in form
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper elevation={0} sx={{ p: 0 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
            
            {editingUser && (
                <EditUserForm
                    user={editingUser}
                    open={openEditDialog}
                    onClose={handleEditDialogClose}
                    onUpdated={handleUserUpdated}
                />
            )} 

            <List>
                {users.length === 0 && !loading && (
                    <ListItem>
                        <ListItemText primary="No users found." />
                    </ListItem>
                )}
                {users.map((user) => (
                    <ListItem key={user._id} divider>
                        <ListItemText 
                            primary={`${user.firstName} ${user.lastName} (${user.username})`}
                            secondary={`Email: ${user.email} | Role: ${user.role} | Department: ${user.department?.name || 'N/A'}`}
                        />
                        <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                    label={user.isActive ? 'Active' : 'Inactive'}
                                    color={user.isActive ? 'success' : 'default'}
                                    size="small"
                                    onClick={() => {}}
                                    sx={{ mr: 1.5 }} // Margin for spacing within the flex box
                                />
                                <Tooltip title="Edit User">
                                    <IconButton aria-label="edit" sx={{ mr: 0.5 }} onClick={() => handleEditClick(user)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

        </Paper>
    );
};

export default UserList;
