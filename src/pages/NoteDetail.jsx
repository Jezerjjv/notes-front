import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    Paper,
    IconButton,
    FormControlLabel,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { projectsService } from '../services/projectsService';
import MDEditor from '@uiw/react-md-editor';
import MarkdownPreview from '@uiw/react-markdown-preview';

const NoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const [editedIsPublic, setEditedIsPublic] = useState(false);
    const isNew = !id || id === 'new';
    const [projectList, setProjectList] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!isNew) {
                    const noteData = await notesService.getNote(id);
                    setNote(noteData);
                    setEditedTitle(noteData.title);
                    setEditedContent(noteData.content);
                    setEditedIsPublic(noteData.isPublic);
                }
                const projects = await projectsService.getAll();
                setProjectList(projects);
                setLoading(false);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                setError('Error al cargar los datos');
                setLoading(false);
            }
        };
        loadData();
    }, [id, isNew]);

    const handleSave = async () => {
        try {
            if (isNew) {
                await notesService.create({
                    title: editedTitle,
                    content: editedContent,
                    isPublic: editedIsPublic,
                    userId: user.id,
                    projectId: selectedProjectId
                });
                navigate('/notes');
            } else {
                await notesService.update(id, {
                    ...note,
                    title: editedTitle,
                    content: editedContent,
                    isPublic: editedIsPublic,
                    ProjectId: note.ProjectId
                });
                setIsEditing(false);
                const updatedNote = await notesService.getNote(id);
                setNote(updatedNote);
            }
        } catch (error) {
            console.error('Error al guardar la nota:', error);
            setError('Error al guardar la nota');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
            try {
                await notesService.delete(id);
                navigate('/notes');
            } catch (error) {
                console.error('Error al eliminar la nota:', error);
                setError('Error al eliminar la nota');
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (isNew) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper sx={{ p: 4, backgroundColor: '#23272f', color: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <IconButton 
                            onClick={() => navigate('/notes')}
                            sx={{ color: '#fff', mr: 2 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                            Nueva Nota
                        </Typography>
                    </Box>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Título"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            variant="outlined"
                        />
                        <MDEditor
                            value={editedContent}
                            onChange={setEditedContent}
                            height={300}
                            preview="edit"
                            style={{ background: '#23272f', color: '#fff', borderRadius: 8 }}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Proyecto</InputLabel>
                            <Select
                                value={selectedProjectId}
                                onChange={e => setSelectedProjectId(e.target.value)}
                                required
                            >
                                {projectList.map((project) => (
                                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editedIsPublic}
                                    onChange={(e) => setEditedIsPublic(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Nota Pública"
                        />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => navigate('/notes')} sx={{ color: '#fff', borderColor: '#fff' }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={!editedTitle || !editedContent || !selectedProjectId}
                            >
                                Guardar
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        );
    }

    if (!note && !loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">Nota no encontrada</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 4, backgroundColor: '#23272f', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton
                        onClick={() => navigate('/notes')}
                        sx={{ color: '#fff', mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        {isEditing ? 'Editar Nota' : 'Detalle de Nota'}
                    </Typography>
                    {user && (user.isAdmin === 1 || note.UserId === user.id) && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedTitle(note.title);
                                            setEditedContent(note.content);
                                            setEditedIsPublic(note.isPublic);
                                        }}
                                        sx={{ color: '#fff', borderColor: '#fff' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={!editedTitle || !editedContent}
                                    >
                                        Guardar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="contained"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Editar
                                    </Button>
                                    <IconButton
                                        color="error"
                                        onClick={handleDelete}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {isEditing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Título"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            variant="outlined"
                        />
                        <MDEditor
                            value={editedContent}
                            onChange={setEditedContent}
                            height={300}
                            preview="edit"
                            style={{ background: '#23272f', color: '#fff', borderRadius: 8 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editedIsPublic}
                                    onChange={(e) => setEditedIsPublic(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Nota Pública"
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="h5">{note.title}</Typography>
                        <MarkdownPreview source={note.content} />
                        <Typography variant="body2" color="text.secondary">
                            {note.isPublic ? 'Nota Pública' : 'Nota Privada'}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default NoteDetail; 