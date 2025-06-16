import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    IconButton,
    TextField,
    Switch,
    FormControlLabel,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import api from '../services/api';
import authService from '../services/authService';
import { projectsService } from '../services/projectsService';
import { notesService } from '../services/notesService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [projects, setProjects] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuNoteId, setMenuNoteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const response = await notesService.getAll();
            const notesData = response;
            const projectsData = groupNotesByProject(notesData);
            setNotes(notesData);
            setProjects(projectsData);
        } catch (error) {
            // Eliminar todos los console.log y console.error
        } finally {
            setLoading(false);
        }
    };

    const groupNotesByProject = (notes) => {
        return notes.reduce((acc, note) => {
            const projectId = note.ProjectId || 'default';
            if (!acc[projectId]) {
                acc[projectId] = {
                    project: note.Project,
                    notes: []
                };
            }
            acc[projectId].notes.push(note);
            return acc;
        }, {});
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
            try {
                await notesService.delete(noteId);
                loadNotes();
            } catch (error) {
                // Eliminar todos los console.log y console.error
            }
        }
    };

    const handleToggleProjectVisibility = async (projectId, isPublic) => {
        try {
            const projectNotes = projects[projectId].notes;
            await Promise.all(
                projectNotes.map(note => 
                    notesService.update(note.id, {
                        ...note,
                        isPublic
                    })
                )
            );
            loadNotes();
        } catch (error) {
            // Eliminar todos los console.log y console.error
        }
    };

    const handleToggleNoteVisibility = async (noteId, isPublic) => {
        try {
            await notesService.update(noteId, { isPublic });
            loadNotes();
        } catch (error) {
            // Eliminar todos los console.log y console.error
        }
    };

    const handleEditClick = (note, e) => {
        e.stopPropagation();
        setEditingNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const handleMenuOpen = (event, noteId) => {
        setAnchorEl(event.currentTarget);
        setMenuNoteId(noteId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuNoteId(null);
    };

    const handleNoteClick = (note, e) => {
        e.stopPropagation();
        navigate(`/notes/${note.id}`);
    };

    const handleSaveEdit = async () => {
        try {
            await notesService.update(editingNote.id, {
                ...editingNote,
                title: editTitle,
                content: editContent,
                ProjectId: editingNote.ProjectId
            });
            setEditingNote(null);
            setEditTitle('');
            setEditContent('');
            loadNotes();
        } catch (error) {
            // Eliminar todos los console.log y console.error
        }
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditTitle('');
        setEditContent('');
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, backgroundColor: '#181c23', color: '#fff', minHeight: '80vh', borderRadius: 3, p: 4 }}>
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1" color="text.primary">
                            Notas
                        </Typography>
                        {user?.isAdmin === true && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/notes/new')}
                            >
                                Nueva Nota
                            </Button>
                        )}
                    </Box>

                    {Object.entries(projects).map(([ProjectId, { project, notes }]) => (
                        <Accordion 
                            key={ProjectId} 
                            sx={{ 
                                mb: 2,
                                backgroundColor: '#23272f',
                                color: '#fff',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: 2,
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    backgroundColor: '#23272f',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '1.2rem',
                                    borderRadius: 1,
                                    '&:hover': {
                                        backgroundColor: '#2d3542',
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
                                    {project || 'Sin Proyecto'}
                                </Typography>
                                {user && user.isAdmin === true && (
                                    <>
                                        <Checkbox
                                            checked={notes.every(note => !!note.isPublic)}
                                            onClick={e => e.stopPropagation()}
                                            onChange={(e) => handleToggleProjectVisibility(ProjectId, e.target.checked)}
                                            color="success"
                                            sx={{ ml: 1 }}
                                        />
                                        <IconButton
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                navigate(`/notes/new?projectId=${ProjectId}`);
                                            }}
                                            size="small"
                                            sx={{ color: '#5ca0fa', ml: 1 }}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </>
                                )}
                            </AccordionSummary>
                            <AccordionDetails>
                                {notes.map((note) => (
                                    <Accordion 
                                        key={note.id} 
                                        sx={{ 
                                            mb: 2,
                                            backgroundColor: '#23272f',
                                            color: '#fff',
                                            border: 'none',
                                            boxShadow: 'none',
                                            '&:before': { display: 'none' },
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            backgroundColor: '#23272f',
                                            color: '#fff',
                                            borderRadius: 2,
                                            px: 2,
                                            py: 1,
                                            '&:hover': {
                                                backgroundColor: '#2d3542',
                                            },
                                        }}>
                                            <AccordionSummary 
                                                expandIcon={<ExpandMoreIcon />}
                                                sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
                                            >
                                                <Typography 
                                                    color="text.primary" 
                                                    sx={{ 
                                                        flexGrow: 1,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            color: '#5ca0fa'
                                                        }
                                                    }}
                                                >
                                                    {note.title}
                                                </Typography>
                                                {user && (user.isAdmin === true || note.UserId === user.id) && (
                                                    <>
                                                        <Checkbox
                                                            checked={!!note.isPublic}
                                                            onClick={e => e.stopPropagation()}
                                                            onChange={async (e) => {
                                                                await handleToggleNoteVisibility(note.id, e.target.checked);
                                                            }}
                                                            color="success"
                                                            sx={{ ml: 1 }}
                                                        />
                                                        <IconButton
                                                            onClick={() => navigate(`/notes/${note.id}`)}
                                                            color="primary"
                                                            size="small"
                                                            sx={{ ml: 1 }}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                                            color="error"
                                                            size="small"
                                                            sx={{ ml: 1 }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </AccordionSummary>
                                        </Box>
                                        <AccordionDetails>
                                            {editingNote && editingNote.id === note.id ? (
                                                <Box sx={{ p: 2 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Título"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="Contenido"
                                                        multiline
                                                        rows={4}
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                        <Button 
                                                            variant="outlined" 
                                                            onClick={handleCancelEdit}
                                                            sx={{ color: '#fff', borderColor: '#fff' }}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button 
                                                            variant="contained" 
                                                            onClick={handleSaveEdit}
                                                            disabled={!editTitle || !editContent}
                                                        >
                                                            Guardar
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box sx={{ mb: 2, overflowX: 'auto' }}>
                                                    <ReactMarkdown
                                                        children={note.content || ''}
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            table: ({node, ...props}) => <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: 16}} {...props} />,
                                                            th: ({isHeader, node, ...props}) => <th style={{border: '1px solid #444', padding: 8, background: '#23272f'}} {...props} />,
                                                            td: ({isHeader, node, ...props}) => <td style={{border: '1px solid #444', padding: 8}} {...props} />,
                                                            tr: ({isHeader, node, ...props}) => <tr style={{borderBottom: '1px solid #444'}} {...props} />,
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{ mb: 1 }}
                                            >
                                                Por: {note?.username}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </>
            )}
        </Container>
    );
};

export default Notes; 