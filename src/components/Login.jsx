import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardHeader, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(username, password);
            navigate('/notes');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setError(error.response.data.message || 'Tu usuario está desactivado. Contacta con el administrador.');
            } else if (error.response && error.response.status === 401) {
                setError(error.response.data.message || 'Credenciales inválidas');
            } else {
                setError('Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" style={{ marginTop: '5rem' }}>
            <Card>
                <CardHeader title="Iniciar Sesión" />
                <CardContent>
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    label="Usuario"
                                    fullWidth
                                    margin="normal"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Contraseña"
                                    type="password"
                                    fullWidth
                                    margin="normal"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: '1rem' }}>
                                    Ingresar
                                </Button>
                            </form>
                        </>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default Login; 