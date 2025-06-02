import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = () => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    width: '100%',
    background: 'transparent',
  }}>
    <CircularProgress size={60} thickness={4} color="primary" />
  </Box>
);

export default LoadingSpinner; 