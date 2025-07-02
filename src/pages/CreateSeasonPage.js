import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, Box, Paper, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import seasonService from '../services/seasonService';
import buyerService from '../services/buyerService'; // To fetch buyers
import { toast } from 'react-toastify';

const CreateSeasonPage = () => {
  const [name, setName] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoadingBuyers(true);
        const buyersData = await buyerService.getAllBuyers(); // Assuming this function exists
        setBuyers(buyersData);
        setError('');
      } catch (err) {
        console.error('Failed to fetch buyers:', err);
        setError(err.message || 'Failed to load buyers for selection.');
        toast.error(err.message || 'Failed to load buyers.');
      }
      setLoadingBuyers(false);
    };
    fetchBuyers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !selectedBuyer) {
      setError('Season name and buyer are required.');
      toast.error('Season name and buyer are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await seasonService.createSeason({ name, buyerId: selectedBuyer });
      toast.success('Season created successfully!');
      navigate('/dashboard', { state: { refresh: true } }); // Redirect and signal refresh
    } catch (err) {
      console.error('Failed to create season:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create season.');
      toast.error(err.response?.data?.message || err.message || 'Failed to create season.');
      setLoading(false);
    }
    // setLoading(false); // This was moved to finally in previous patterns, but for now, only on error.
  };

  return (
    <Container component={Paper} sx={{ mt: 4, p: 3, width: '40%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Create New Season
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Season Name"
          name="name"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <FormControl fullWidth margin="normal" required disabled={loading || loadingBuyers}>
          <InputLabel id="buyer-select-label">Buyer</InputLabel>
          <Select
            labelId="buyer-select-label"
            id="buyer-select"
            value={selectedBuyer}
            label="Buyer"
            onChange={(e) => setSelectedBuyer(e.target.value)}
          >
            {loadingBuyers ? (
              <MenuItem disabled value="">
                <em>Loading buyers...</em>
              </MenuItem>
            ) : buyers.length > 0 ? (
              buyers.map((buyer) => (
                <MenuItem key={buyer._id} value={buyer._id}>
                  {buyer.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                <em>No buyers available. Please create a buyer first.</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || loadingBuyers}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Season'}
        </Button>
      </Box>
    </Container>
  );
};

export default CreateSeasonPage;
