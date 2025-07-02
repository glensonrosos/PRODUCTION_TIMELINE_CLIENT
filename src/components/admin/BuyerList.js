import React, { useState, useEffect, useCallback } from 'react';
import buyerService from '../../services/buyerService';
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
import EditBuyerForm from './EditBuyerForm'; // Import EditBuyerForm

const BuyerList = () => {
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [buyerToDelete, setBuyerToDelete] = useState(null);

    const [editingBuyer, setEditingBuyer] = useState(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const fetchBuyers = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await buyerService.getAllBuyers();
            setBuyers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch buyers.');
            console.error("Fetch buyers error:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchBuyers();
    }, [fetchBuyers]);

    const handleDeleteClick = (buyer) => {
        setBuyerToDelete(buyer);
        setOpenDeleteDialog(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDeleteConfirm = async () => {
        if (!buyerToDelete) return;
        try {
            await buyerService.deleteBuyer(buyerToDelete._id);
            setSuccessMessage(`Buyer '${buyerToDelete.name}' deleted successfully.`);
            setBuyerToDelete(null);
            fetchBuyers(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete buyer.');
            console.error("Delete buyer error:", err);
        }
        setOpenDeleteDialog(false);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setBuyerToDelete(null);
    };

    const handleEditClick = (buyer) => {
        setEditingBuyer(buyer);
        setOpenEditDialog(true);
        setError('');
        setSuccessMessage('');
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
        setEditingBuyer(null);
    };

    const handleBuyerUpdated = () => {
        fetchBuyers(); // Refresh the list after an update
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper elevation={0} sx={{ p: 0 }}> {/* Adjusted elevation for modal use */}
            <Typography variant="h6" gutterBottom sx={{display: 'none'}}>Manage Buyers</Typography> {/* Title can be in DialogTitle */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
            {editingBuyer && (
                <EditBuyerForm
                    buyer={editingBuyer}
                    open={openEditDialog}
                    onClose={handleEditDialogClose}
                    onUpdated={handleBuyerUpdated}
                />
            )} 
            <List>
                {buyers.length === 0 && !loading && (
                    <ListItem>
                        <ListItemText primary="No buyers found." />
                    </ListItem>
                )}
                {buyers.map((buyer) => (
                    <ListItem key={buyer._id} divider>
                        <ListItemText primary={buyer.name} />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }} onClick={() => handleEditClick(buyer)}>
                                <EditIcon />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(buyer)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete buyer "{buyerToDelete?.name}"? 
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

export default BuyerList;
