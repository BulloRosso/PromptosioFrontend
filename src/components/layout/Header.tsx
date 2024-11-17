// src/components/layout/Header.tsx
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton 
} from '@mui/material';
import { Menu } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <Menu />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Prompt Management System
        </Typography>
      </Toolbar>
    </AppBar>
  );
};