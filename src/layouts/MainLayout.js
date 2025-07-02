import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom'; // Added Link as RouterLink
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar, Toolbar, Typography, Box, Container, IconButton, Menu, MenuItem, Avatar
} from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu'; // Example for a potential sidebar toggle - removed as unused
import AccountCircle from '@mui/icons-material/AccountCircle';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };
  
  const handleChangePassword = () => {
    navigate('/change-password');
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh',
     }}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" component={RouterLink} to="/dashboard" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            PEBA Production Timeline
          </Typography>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ mr: 1, color: 'inherit' }}>
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User'}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : <AccountCircle />}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleChangePassword}>Change Password</MenuItem>
                                {user && user.role === 'Admin' && (
                  <MenuItem component={RouterLink} to="/admin" onClick={handleClose}>
                    Admin Dashboard
                  </MenuItem>
                )}
                {user && (user.role === 'Planner' || user.role === 'Admin') && (
                  <MenuItem component={RouterLink} to="/planner-dashboard" onClick={handleClose}>
                    Planner Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Sidebar could be added here if needed */}
      
      <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, pt:2 }} >
        {/* Outlet will render the child route's component (e.g., DashboardPage) */}
        <Outlet />
      </Container>

      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 2, textAlign: 'center', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} GLENSON_ENCODE SYSTEMS
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;
