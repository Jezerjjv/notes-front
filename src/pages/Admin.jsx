import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  FormControlLabel,
  IconButton
} from '@mui/material';
import { usersService } from '../services/usersService';
import authService from '../services/authService';
import Checkbox from '@mui/material/Checkbox';
import LoadingSpinner from '../components/LoadingSpinner';
import DeleteIcon from '@mui/icons-material/Delete';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersService.getAll();
      setUsers(response);
      setError('');
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await usersService.create(newUser, currentUser.isAdmin);
      setOpenModal(false);
      setNewUser({ username: '', password: '', role: 'user', isAdmin: false });
      loadUsers();
      setSnackbar({
        open: true,
        message: 'Usuario creado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear el usuario');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleToggleUserStatus = async (id, isActive, isAdmin) => {
    try {
      await usersService.update(id, { isActive: !isActive }, currentUser.isAdmin);
      await loadUsers();
      setSnackbar({
        open: true,
        message: `Usuario ${id} ${isActive ? 'desactivado' : 'activado'}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al actualizar estado',
        severity: 'error'
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Typography variant="h4" component="h1" gutterBottom>
            Administración de Usuarios
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
            sx={{ mb: 3 }}
          >
            Nuevo Usuario
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.id === 1 ? (
                        <Checkbox
                          checked={!!user.isAdmin}
                          disabled
                          color="secondary"
                          sx={{ color: 'secondary.main' }}
                        />
                      ) : (
                        <Checkbox
                          checked={!!user.isAdmin}
                          onChange={async (e) => {
                            try {
                              await usersService.update(user.id, { isAdmin: !user.isAdmin }, currentUser.isAdmin);
                              await loadUsers();
                              setSnackbar({
                                open: true,
                                message: `Usuario ${user.username} ahora es${!e.target.checked ? '' : ' NO'} admin`,
                                severity: 'success'
                              });
                            } catch (error) {
                              setSnackbar({
                                open: true,
                                message: error.response?.data?.message || 'Error al actualizar admin',
                                severity: 'error'
                              });
                            }
                          }}
                          color="secondary"
                          sx={{ color: 'secondary.main' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{user.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color={user.isActive ? 'error' : 'success'}
                        onClick={() => handleToggleUserStatus(user.id, user.isActive, user.isAdmin)}
                        sx={{ mr: 1 }}
                      >
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <IconButton
                        color="error"
                        onClick={async () => {
                          if (window.confirm(`¿Seguro que quieres eliminar al usuario ${user.username}?`)) {
                            try {
                              await usersService.delete(user.id, currentUser.isAdmin);
                              await loadUsers();
                              setSnackbar({
                                open: true,
                                message: `Usuario ${user.username} eliminado correctamente`,
                                severity: 'success'
                              });
                            } catch (error) {
                              setSnackbar({
                                open: true,
                                message: error.response?.data?.message || 'Error al eliminar el usuario',
                                severity: 'error'
                              });
                            }
                          }
                        }}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={openModal} onClose={() => setOpenModal(false)}>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Usuario"
                fullWidth
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />
              <TextField
                margin="dense"
                label="Contraseña"
                type="password"
                fullWidth
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={newUser.role}
                  label="Rol"
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!newUser.isAdmin}
                    onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                    color="primary"
                  />
                }
                label="¿Es administrador?"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} variant="contained" color="primary">
                Crear
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
};

export default Admin;
