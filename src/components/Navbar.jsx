import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
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
        <AppBar position="static" sx={{ backgroundColor: '#181818', color: '#fff', boxShadow: 3 }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#fff' }}>
                    Notes App
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/notes')}
                        sx={{ '&:hover': { backgroundColor: '#232323' }, color: '#fff' }}
                    >
                        Notas
                    </Button>
                    {user.isAdmin && (
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/projects')}
                            sx={{ '&:hover': { backgroundColor: '#232323' }, color: '#fff' }}
                        >
                            Proyectos
                        </Button>
                    )}
                    {user.isAdmin && (
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/admin')}
                            sx={{ '&:hover': { backgroundColor: '#232323' }, color: '#fff' }}
                        >
                            Admin
                        </Button>
                    )}
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                        sx={{ '&:hover': { backgroundColor: '#232323' }, color: '#fff' }}
                    >
                        Cerrar Sesión
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 