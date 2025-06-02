import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!user.isAdmin) {
        navigate('/notes');
        return;
      }
      await loadProjects();
    };
    checkAccess();
  }, [user, navigate]);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user) return;
    
    try {
      await api.post('/projects', {
        ...newProject,
        userId: user.id,
        isAdmin: user.isAdmin
      });
      setOpenModal(false);
      setNewProject({ name: '', description: '' });
      await loadProjects();
      setError('');
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      setError('Error al crear el proyecto');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      try {
        await api.delete(`/projects/${projectId}`);
        await loadProjects();
        setError('');
      } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        setError('Error al eliminar el proyecto');
      }
    }
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, backgroundColor: '#181c23', color: '#fff', minHeight: '80vh', borderRadius: 3, p: 4 }}>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" color="text.primary">
              Proyectos
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ mb: 3 }}
            >
              Crear Proyecto
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item key={project.id} xs={12} sm={6} md={4}>
                <Card sx={{ 
                  backgroundColor: '#23272f',
                  color: '#fff',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    backgroundColor: '#2d3542'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography 
                      component="div" 
                      color="text.secondary"
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        '& p': { mb: 2 },
                        '& ul, & ol': { pl: 4, mb: 2 },
                        '& li': { mb: 1 }
                      }}
                    >
                      {project.description || ''}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/notes?projectId=${project.id}`)}
                    >
                      Ver Notas
                    </Button>
                    <Box>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/projects/${project.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog 
            open={openModal} 
            onClose={() => setOpenModal(false)}
            PaperProps={{
              sx: {
                backgroundColor: '#23272f',
                color: '#fff'
              }
            }}
          >
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Nombre"
                fullWidth
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': { color: '#fff' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#444' },
                    '&:hover fieldset': { borderColor: '#666' },
                    '&.Mui-focused fieldset': { borderColor: '#5ca0fa' }
                  },
                  '& .MuiInputBase-input': { color: '#fff' }
                }}
              />
              <TextField
                margin="dense"
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': { color: '#fff' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#444' },
                    '&:hover fieldset': { borderColor: '#666' },
                    '&.Mui-focused fieldset': { borderColor: '#5ca0fa' }
                  },
                  '& .MuiInputBase-input': { color: '#fff' }
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setOpenModal(false)}
                sx={{ color: '#fff' }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateProject} 
                color="primary"
                disabled={!newProject.name.trim()}
              >
                Crear
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default Projects; 