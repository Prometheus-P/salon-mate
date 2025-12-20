import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'; // For flexible layout

export default function Header() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          {/* Using img tag to display the SVG logo */}
          <img src="/logo.svg" alt="SalonMate Logo" style={{ height: '40px', marginRight: '16px' }} />
          <Typography variant="h6" component="div">
            SalonMate Dashboard
          </Typography>
        </Box>
        {/* Add navigation items or other elements here */}
      </Toolbar>
    </AppBar>
  );
}
