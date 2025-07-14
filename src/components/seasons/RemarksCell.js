import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import RemarksModal from './RemarksModal';

const RemarksCell = ({ params, isEditable, onSave }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const remarks = params.row.remarks || '';

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSave = (updatedRemarks) => {
        onSave(params.row, updatedRemarks);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center',pt:1}}>
                {remarks ? (
                    <>
                        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                            {remarks.substring(0, 10)}{remarks.length > 10 ? '...' : ''}
                        </Typography>
                        <Button size="small" variant="outlined"  onClick={handleOpenModal} sx={{ ml: 1, flexShrink: 0 }}>
                            View More...
                        </Button>
                    </>
                ) : (
                    <Button size="small" variant="outlined" onClick={handleOpenModal} disabled={!isEditable}>
                        Edit
                    </Button>
                )}
            </Box>
            <RemarksModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                remarks={remarks}
                isEditable={isEditable}
            />
        </>
    );
};

export default RemarksCell;
