import React from 'react';
import { Outlet } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import backgroundImage from '../public/background.jpg';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        overflow: 'auto', // Allows scrolling if content exceeds viewport
      }}
    >
      <Container 
        component="main"
        maxWidth="sm"
        sx={{
          height: '100%', // Takes full height of parent Box
          display: 'flex',
          alignItems: 'center', // Centers vertically
          justifyContent: 'center', // Centers horizontally
        }}
      >
      
          <Outlet />
       
      </Container>
    </Box>
  );
};

export default AuthLayout;
