import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, Switch, FormControlLabel, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { format } from 'date-fns';

const PlannerDashboardPage = () => {
  const { user } = useAuth();
  const [emailLogs, setEmailLogs] = useState([]);
  const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  const api = axios.create({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  const fetchEmailLogs = async () => {
    try {
      const res = await api.get('/api/settings/email-logs');
      setEmailLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      // Convert array to a key-value object for easier access
      const settingsMap = res.data.reduce((acc, setting) => {
        acc[setting.key] = setting;
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchEmailLogs(), fetchSettings()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleNotificationToggle = async (event) => {
    const isEnabled = event.target.checked;
    const key = 'emailNotificationsEnabled';

    try {
      const res = await api.put(`/api/settings/${key}`, { value: isEnabled });
      setSettings(prev => ({ ...prev, [key]: res.data }));
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      // Optionally, revert the switch state on error
    }
  };

    const handleResendNotifications = async () => {
    setResending(true);
    try {
      const res = await api.post('/api/settings/resend-notifications');
      alert(res.data.message || 'Notifications resent successfully.'); // Using alert for simplicity
      fetchEmailLogs(); // Refresh logs to show the resent emails
    } catch (error) {
      console.error('Failed to resend notifications:', error);
      alert(error.response?.data?.message || 'An error occurred while resending notifications.');
    }
    setResending(false);
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to delete all email logs? This action cannot be undone.')) {
      try {
        const res = await api.delete('/api/logs/email');
        alert(res.data.message || 'Email logs cleared successfully.');
        fetchEmailLogs(); // Refresh the logs, which should now be empty
      } catch (error) {
        console.error('Failed to clear email logs:', error);
        alert(error.response?.data?.message || 'An error occurred while clearing email logs.');
      }
    }
  };

  const columns = [
    { field: 'sentAt', headerName: 'Date', width: 160, valueFormatter: (value) => format(new Date(value), 'yyyy-MM-dd HH:mm') },
    { field: 'recipient', headerName: 'Recipient', width: 200 },
    { field: 'seasonName', headerName: 'Season', width: 200, valueGetter: (value, row) => row.season?.name || 'N/A' },
    { field: 'subject', headerName: 'Subject', width: 250 },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (params) => (
      <Typography color={params.value === 'sent' ? 'green' : 'error'}>
        {params.value}
      </Typography>
    ) },
    { field: 'error', headerName: 'Error Details', width: 300, flex: 1 },
  ];

  const emailNotificationsEnabled = settings['emailNotificationsEnabled']?.value || false;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Planner Dashboard</Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">System Settings</Typography>
        <FormControlLabel
          control={<Switch checked={emailNotificationsEnabled} onChange={handleNotificationToggle} />}
          label="Enable Email Notifications"
        />
        <Box sx={{ mt: 2 }}>
                        <Button 
                variant="contained" 
                onClick={handleResendNotifications} 
                disabled={!emailNotificationsEnabled || resending}
            >
                {resending ? 'Resending...' : 'Resend All Pending Notifications'}
            </Button>
            {(user?.role === 'Admin' || user?.role === 'Planner') && (
              <Button 
                variant="contained" 
                color="error"
                onClick={handleClearLogs} 
                sx={{ ml: 2 }}
              >
                Clear All Email Logs
              </Button>
            )}
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <Typography variant="h6" sx={{ p: 2 }}>Email Sending Logs</Typography>
        <DataGrid
          rows={emailLogs}
          columns={columns}
          loading={loading}
          getRowId={(row) => row._id}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 100 },
            },
          }}
          pageSizeOptions={[10, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default PlannerDashboardPage;
