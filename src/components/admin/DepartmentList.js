import React, { useState, useEffect, useCallback } from 'react';
import departmentService from '../../services/departmentService';
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
    DialogTitle 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDepartmentForm from './EditDepartmentForm'; // Import the EditDepartmentForm

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);

    const [editingDepartment, setEditingDepartment] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await departmentService.getAllDepartments();
            setDepartments(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch departments.');
            console.error("Fetch departments error:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleDeleteClick = (department) => {
        setDepartmentToDelete(department);
        setOpenDeleteDialog(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDeleteConfirm = async () => {
        if (!departmentToDelete) return;
        try {
            await departmentService.deleteDepartment(departmentToDelete._id);
            setSuccessMessage(`Department '${departmentToDelete.name}' deleted successfully.`);
            setDepartmentToDelete(null);
            fetchDepartments(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete department.');
            console.error("Delete department error:", err);
        }
        setOpenDeleteDialog(false);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setDepartmentToDelete(null);
    };

    const handleEditClick = (department) => {
        setEditingDepartment(department);
        setOpenEditDialog(true);
        setError('');
        setSuccessMessage('');
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
        setEditingDepartment(null);
    };

    const handleDepartmentUpdated = () => {
        fetchDepartments(); // Refresh the list after an update
        // Success message is handled by EditDepartmentForm, or could be set here too
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h5" gutterBottom>Manage Departments</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
            {editingDepartment && (
                <EditDepartmentForm
                    department={editingDepartment}
                    open={openEditDialog}
                    onClose={handleEditDialogClose}
                    onUpdated={handleDepartmentUpdated}
                />
            )} 
            <List>
                {departments.length === 0 && !loading && (
                    <ListItem>
                        <ListItemText primary="No departments found." />
                    </ListItem>
                )}
                {departments.map((dept) => (
                    <ListItem key={dept._id} divider>
                        <ListItemText primary={dept.name} />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }} onClick={() => handleEditClick(dept)}>
                                <EditIcon />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(dept)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete department "{departmentToDelete?.name}"? 
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default DepartmentList;
