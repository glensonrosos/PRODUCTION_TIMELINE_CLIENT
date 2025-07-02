import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color (Material UI blue)
    },
    secondary: {
      main: '#dc004e', // Example secondary color (Material UI pink)
    },
    background: {
      default: '#f4f6f8', // Light grey background
      paper: '#ffffff',   // White for paper elements like cards
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.2rem',
      fontWeight: 500,
    },
    // Add more typography variants as needed
  },
  components: {
    // Example: Default props for MuiButton
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No uppercase buttons by default
        },
      },
    },
    MuiAppBar: {
        styleOverrides: {
            colorPrimary: {
                backgroundColor: '#333' // Darker AppBar
            }
        }
    }
  }
});

export default theme;
