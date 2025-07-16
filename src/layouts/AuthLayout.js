import React from 'react';
import { Outlet } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import backgroundImage from '../public/background.jpg';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden', // Prevents double scrollbars
      }}
    >
      {/* Left side - Background image */}
      <Box
        sx={{
          width: { xs: 0, md: '80%' }, // Hidden on mobile, half screen on desktop
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Right side - Login form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' }, // Full width on mobile, half on desktop
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper', // Uses theme's paper color
          overflowY: 'auto', // Allows scrolling if content is too tall
        }}
      >
        <Container 
          component="main"
          maxWidth="sm"
          sx={{
            py: 4, // Padding top and bottom
            px: { xs: 2, sm: 3 }, // Responsive padding
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;