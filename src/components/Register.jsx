import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardHeader, CardContent, TextField, Button } from '@mui/material';
import authService from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(username, password);
      alert('Usuario registrado correctamente');
      navigate('/login');
    } catch (error) {
      alert('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: '5rem' }}>
      <Card>
        <CardHeader title="Registro" />
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : (
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
                Registrarse
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register; 