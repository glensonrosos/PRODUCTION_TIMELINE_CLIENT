import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import seasonService from '../../services/seasonService';

const ActivityLogViewer = ({ open, onClose, seasonId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    setError('');
    try {
      const data = await seasonService.getSeasonLogs(seasonId);
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, fetchLogs]);

  const columns = [
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 160,
      valueFormatter: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
    {
      field: 'user',
      headerName: 'User',
      width: 150,
      valueGetter: (value, row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System'),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 120,
      valueGetter: (value, row) => row.user?.department?.name || 'N/A',
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 300,
      valueFormatter: (value) => value.replace(/_/g, ' ').toLowerCase(),
      renderCell: (params) => (
        <Typography sx={{ textTransform: 'capitalize' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'taskName',
      headerName: 'Task Name',
      width: 200,
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ whiteSpace: 'normal', lineHeight: '1.2' }}>
          {params.value || 'N/A'}
        </Typography>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Activity Logs</DialogTitle>
      <DialogContent>
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={logs}
            columns={columns}
            loading={loading}
            getRowId={(row) => row._id}
            initialState={{
              pagination: { paginationModel: { pageSize: 100 } },
              sorting: {
                sortModel: [{ field: 'createdAt', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #e0e0e0',
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityLogViewer;
