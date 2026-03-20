import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) {
        return null;
    }

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                backgroundColor: 'background.paper',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                    Notes App
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                    <Chip
                        size="small"
                        label={`Logueado: ${user.username} (${user.isAdmin ? 'admin' : 'user'})`}
                        variant="outlined"
                        sx={{
                            color: 'text.secondary',
                            borderColor: 'divider',
                            mr: 0.5,
                        }}
                    />
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/notes')}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' }, color: 'text.primary' }}
                    >
                        Notas
                    </Button>
                    <Button
                        color="inherit"
                        onClick={() => navigate('/calendar')}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' }, color: 'text.primary' }}
                    >
                        Calendario
                    </Button>
                    {user.isAdmin && (
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/projects')}
                            sx={{ '&:hover': { backgroundColor: 'action.hover' }, color: 'text.primary' }}
                        >
                            Proyectos
                        </Button>
                    )}
                    {user.isAdmin && (
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/admin')}
                            sx={{ '&:hover': { backgroundColor: 'action.hover' }, color: 'text.primary' }}
                        >
                            Admin
                        </Button>
                    )}
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' }, color: 'text.secondary' }}
                    >
                        Cerrar Sesión
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 