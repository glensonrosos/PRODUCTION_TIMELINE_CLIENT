import React, { useState, useEffect } from 'react';
import buyerService from '../../services/buyerService';
import {
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    Backdrop // Added Backdrop
} from '@mui/material';
import { toast } from 'react-toastify'; // Added react-toastify

const EditBuyerForm = ({ buyer, open, onClose, onUpdated }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); // Keep for TextField helperText if desired

    useEffect(() => {
        if (buyer) {
            setName(buyer.name);
        }
        setError('');
    }, [buyer, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Buyer name cannot be empty.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await buyerService.updateBuyer(buyer._id, { name });
            toast.success('Buyer updated successfully!'); // Replaced Alert with toast
            if (onUpdated) {
                onUpdated(); // Callback to refresh parent list
            }
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update buyer.';
            toast.error(errorMessage); // Replaced Alert with toast
            setError(errorMessage); // Keep for TextField helperText if needed
            console.error("Update buyer error:", err);
        }
        setLoading(false);
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
        setName('');
        setError('');
        setLoading(false);
    };

    if (!open) {
        return null;
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }} // Ensure backdrop is above dialog
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <DialogTitle>Edit Buyer</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {/* {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} Removed Alert */}
                    {/* {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>} Removed Alert */}
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Buyer Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={handleClose} color="inherit" disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditBuyerForm;
