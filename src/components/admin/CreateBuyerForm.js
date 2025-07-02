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
import buyerService from '../../services/buyerService'; // Corrected import

const CreateBuyerForm = ({ onBuyerCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Buyer name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newBuyer = await buyerService.createBuyer({ name });
      toast.success(`Buyer "${newBuyer.name}" created successfully!`);
      setName(''); // Reset form
      if (onBuyerCreated) {
        onBuyerCreated(newBuyer); // Callback for parent component
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create buyer.';
      toast.error(errorMessage);
      setError(errorMessage);
      console.error('Failed to create buyer:', err);
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create New Buyer
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
          id="buyerName"
          label="Buyer Name"
          name="buyerName"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
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
          {loading ? <CircularProgress size={24} /> : 'Create Buyer'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreateBuyerForm;
