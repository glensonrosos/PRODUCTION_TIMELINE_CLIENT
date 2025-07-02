import React, { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CreateDepartmentForm from '../components/admin/CreateDepartmentForm';
import CreateBuyerForm from '../components/admin/CreateBuyerForm';
import RegisterUserForm from '../components/admin/RegisterUserForm';
import CreateTaskForm from '../components/admin/CreateTaskForm';
import DepartmentList from '../components/admin/DepartmentList';
import BuyerList from '../components/admin/BuyerList';
import UserList from '../components/admin/UserList'; // Import UserList
import CreateTaskTemplateForm from '../components/admin/CreateTaskTemplateForm';
import TaskTemplateList from '../components/admin/TaskTemplateList';

// Placeholder components for admin actions - will be developed later





const AdminDashboardPage = () => {
  const taskListRef = useRef(null);
  const [openDepartmentListModal, setOpenDepartmentListModal] = useState(false);

  const handleOpenDepartmentListModal = () => {
    setOpenDepartmentListModal(true);
  };

  const handleCloseDepartmentListModal = () => {
    setOpenDepartmentListModal(false);
  };

  const [openBuyerListModal, setOpenBuyerListModal] = useState(false);

  const handleOpenBuyerListModal = () => {
    setOpenBuyerListModal(true);
  };

  const handleCloseBuyerListModal = () => {
    setOpenBuyerListModal(false);
  };

  const [openUserListModal, setOpenUserListModal] = useState(false);

  const handleOpenUserListModal = () => {
    setOpenUserListModal(true);
  };

  const handleCloseUserListModal = () => {
    setOpenUserListModal(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Row 1: Department and Buyer Forms */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manage Departments</Typography>
              <Button variant="contained" color="success" onClick={handleOpenDepartmentListModal}>
                View Department List
              </Button>
            </Box>
            <CreateDepartmentForm onDepartmentCreated={(newDepartment) => console.log('Department created:', newDepartment)} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manage Buyers</Typography>
              <Button variant="contained" color="success" onClick={handleOpenBuyerListModal}>
                View Buyer List
              </Button>
            </Box>
            <CreateBuyerForm onBuyerCreated={(newBuyer) => console.log('Buyer created:', newBuyer)} />
          </Paper>
        </Grid>

        {/* Row 2: Register User Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manage Users</Typography>
              <Button variant="contained" color="success" onClick={handleOpenUserListModal}>
                View User List
              </Button>
            </Box>
            <Typography variant="subtitle1" gutterBottom>Register New User</Typography>
            <RegisterUserForm onUserRegistered={(newUser) => console.log('User registered:', newUser)} />
          </Paper>
        </Grid>

        {/* Row 3: Create Task Form (placeholder, might be removed or repurposed) */}
        {/* <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12}> 
              <Paper sx={{ p: 3, mt: 3 }}>
                <CreateTaskForm onTaskCreated={(newTask) => console.log('Task created:', newTask)} />
              </Paper>
            </Grid>
          </Grid>
        </Grid> */}

        {/* Row 4: Create Task Template Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Manage Task Templates</Typography>
            <CreateTaskTemplateForm onTemplateCreated={() => taskListRef.current?.refresh()} />
            <TaskTemplateList ref={taskListRef} />
          </Paper>
        </Grid>
        
        {/* Add more admin sections/components here */}
      </Grid>
      {/* Department List Modal */}
      <Dialog open={openDepartmentListModal} onClose={handleCloseDepartmentListModal} fullWidth maxWidth="md">
        <DialogTitle>Department List</DialogTitle>
        <DialogContent>
          <DepartmentList />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDepartmentListModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Buyer List Modal */}
      <Dialog open={openBuyerListModal} onClose={handleCloseBuyerListModal} fullWidth maxWidth="md">
        <DialogTitle>Buyer List</DialogTitle>
        <DialogContent>
          <BuyerList />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBuyerListModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User List Modal */}
      <Dialog open={openUserListModal} onClose={handleCloseUserListModal} fullWidth maxWidth="lg"> {/* Changed maxWidth to lg for more space */}
        <DialogTitle>User List</DialogTitle>
        <DialogContent>
          <UserList />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserListModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboardPage;
