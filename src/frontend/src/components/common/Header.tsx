'use client';

import Image from 'next/image';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'; // For flexible layout

export default function Header() {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={(theme) => ({
        backdropFilter: 'blur(16px)',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
        borderBottom:
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(17, 24, 39, 0.08)',
        boxShadow: 'none',
      })}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Image
            src="/logo.svg"
            alt="SalonMate Logo"
            width={40}
            height={40}
            priority
            style={{ marginRight: '16px', height: '40px', width: '40px' }}
          />
          <Typography variant="h6" component="div">
            SalonMate Dashboard
          </Typography>
        </Box>
        {/* Add navigation items or other elements here */}
      </Toolbar>
    </AppBar>
  );
}
