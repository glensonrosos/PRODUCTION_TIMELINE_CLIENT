import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    Box
} from '@mui/material';

const RemarksModal = ({ open, onClose, onSave, remarks, isEditable }) => {
    const [editedRemarks, setEditedRemarks] = useState(remarks || '');

    useEffect(() => {
        if (open) {
            setEditedRemarks(remarks || '');
        }
    }, [remarks, open]);

    const handleSave = () => {
        onSave(editedRemarks);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>{isEditable ? 'Edit Remarks' : 'View Remarks'}</DialogTitle>
            <DialogContent>
                {isEditable ? (
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Remarks"
                        type="text"
                        fullWidth
                        multiline
                        rows={25}
                        variant="outlined"
                        value={editedRemarks}
                        onChange={(e) => setEditedRemarks(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                ) : (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
                        <Typography variant="body1">
                            {remarks || 'No remarks provided.'}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {isEditable && (
                    <Button onClick={handleSave} variant="contained">Save</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RemarksModal;
