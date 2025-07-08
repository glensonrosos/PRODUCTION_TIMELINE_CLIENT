import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import buyerService from '../../services/buyerService';

const EditSeasonModal = ({ open, onClose, season, onSave }) => {
  const [name, setName] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (season) {
      setName(season.name || '');
      setBuyerId(season.buyer?._id || '');
    }
  }, [season]);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const data = await buyerService.getAllBuyers();
        setBuyers(data);
      } catch (error) {
        console.error('Failed to fetch buyers:', error);
      }
    };
    fetchBuyers();
  }, []);

  const handleSave = () => {
    onSave({ name, buyer: buyerId });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Season Details</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Season Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel>Buyer</InputLabel>
          <Select
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            label="Buyer"
          >
            {buyers.map((b) => (
              <MenuItem key={b._id} value={b._id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSeasonModal;
