import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
    Container,
    Typography,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    IconButton,
    Checkbox,
    Tooltip,
    Fab,
    Zoom
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import authService from '../services/authService';
import { notesService } from '../services/notesService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeHighlighter = lazy(() => import('../components/CodeHighlighter'));

const markdownRenderers = {
    table: ({ ...props }) => (
        <table
            style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: 16,
                background: '#161b22',
                border: '1px solid #30363d',
            }}
            {...props}
        />
    ),
    th: ({ ...props }) => (
        <th
            style={{
                border: '1px solid #30363d',
                padding: 10,
                background: '#21262d',
                textAlign: 'left',
            }}
            {...props}
        />
    ),
    td: ({ ...props }) => (
        <td
            style={{
                border: '1px solid #30363d',
                padding: 10,
            }}
            {...props}
        />
    ),
    blockquote: ({ ...props }) => (
        <blockquote
            style={{
                margin: '12px 0',
                padding: '8px 14px',
                borderLeft: '4px solid #58a6ff',
                background: '#161b22',
                color: '#8b949e',
            }}
            {...props}
        />
    ),
    code({ inline, className, children }) {
        if (inline) {
            return (
                <code
                    style={{
                        background: '#161b22',
                        border: '1px solid #30363d',
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: '#c9d1d9',
                    }}
                >
                    {children}
                </code>
            );
        }

        const match = /language-(\w+)/.exec(className || '');
        const language = match?.[1] || 'text';
        const codeText = String(children).replace(/\n$/, '');

        return (
            <Suspense
                fallback={
                    <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #30363d', p: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        >
                            {language}
                        </Typography>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{codeText}</pre>
                    </Box>
                }
            >
                <CodeHighlighter language={language} codeText={codeText} />
            </Suspense>
        );
    },
};

const notesUi = {
    parentBg: '#161b22',
    parentHover: '#21262d',
    parentBorder: '#30363d',
    childBg: '#1c2128',
    childHover: '#232a32',
    childBorder: '#30363d',
    accent: '#58a6ff',
    icon: '#8b949e',
};

const Notes = () => {
    const [projects, setProjects] = useState({});
    const [loading, setLoading] = useState(true);
    const [showGlobalScrollTop, setShowGlobalScrollTop] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState({});
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const loadNotes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await notesService.getAll();
            const notesData = response;
            const projectsData = groupNotesByProject(notesData);
            setProjects(projectsData);
        } catch (error) {
            // Eliminar todos los console.log y console.error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    useEffect(() => {
        const onScroll = () => {
            setShowGlobalScrollTop(window.scrollY > 280);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleScrollToNoteTop = (noteId) => {
        const noteElement = document.getElementById(`note-${noteId}`);
        if (noteElement) {
            noteElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleGlobalScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleProjectExpandToggle = (projectNotes) => {
        const allExpanded = projectNotes.length > 0 && projectNotes.every((n) => !!expandedNotes[n.id]);
        setExpandedNotes((prev) => {
            const next = { ...prev };
            projectNotes.forEach((note) => {
                next[note.id] = !allExpanded;
            });
            return next;
        });
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

    return (
        <Container maxWidth="xl" sx={{ width: '100%', mt: 4, backgroundColor: 'background.paper', color: 'text.primary', minHeight: '80vh', borderRadius: 3, p: 4 }}>
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
                            TransitionProps={{ timeout: 0, unmountOnExit: true }}
                            sx={{ 
                                mb: 2,
                                backgroundColor: notesUi.parentBg,
                                color: 'text.primary',
                                border: '1px solid',
                                borderColor: notesUi.parentBorder,
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                                borderRadius: 2,
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    backgroundColor: notesUi.parentBg,
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    fontSize: '1.2rem',
                                    borderRadius: 1,
                                    '&:hover': {
                                        backgroundColor: notesUi.parentHover,
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
                                    {project || 'Sin Proyecto'}
                                </Typography>
                                <Tooltip
                                    title={
                                        notes.length > 0 && notes.every((n) => !!expandedNotes[n.id])
                                            ? 'Comprimir todas las notas'
                                            : 'Expandir todas las notas'
                                    }
                                    arrow
                                >
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProjectExpandToggle(notes);
                                        }}
                                        size="small"
                                        sx={{ color: notesUi.icon, ml: 1 }}
                                    >
                                        {notes.length > 0 && notes.every((n) => !!expandedNotes[n.id]) ? (
                                            <UnfoldLessIcon fontSize="small" />
                                        ) : (
                                            <UnfoldMoreIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                {user && user.isAdmin === true && (
                                    <>
                                        <Checkbox
                                            checked={notes.every(note => !!note.isPublic)}
                                            onClick={e => e.stopPropagation()}
                                            onChange={(e) => handleToggleProjectVisibility(ProjectId, e.target.checked)}
                                            color="primary"
                                            sx={{ ml: 1, color: notesUi.icon }}
                                        />
                                        <IconButton
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                navigate(`/notes/new?projectId=${ProjectId}`);
                                            }}
                                            size="small"
                                            sx={{ color: notesUi.icon, ml: 1 }}
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
                                        id={`note-${note.id}`}
                                        expanded={!!expandedNotes[note.id]}
                                        onChange={(_, isExpanded) => {
                                            setExpandedNotes((prev) => ({ ...prev, [note.id]: isExpanded }));
                                        }}
                                        TransitionProps={{ timeout: 0, unmountOnExit: true }}
                                        sx={{ 
                                            mb: 2,
                                            ml: 2,
                                            backgroundColor: notesUi.childBg,
                                            color: 'text.primary',
                                            border: '1px solid',
                                            borderColor: notesUi.childBorder,
                                            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                                            '&:before': { display: 'none' },
                                            borderLeft: `3px solid ${notesUi.accent}`,
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            backgroundColor: notesUi.childBg,
                                            color: 'text.primary',
                                            borderRadius: 2,
                                            px: 2,
                                            py: 1,
                                            '&:hover': {
                                                backgroundColor: notesUi.childHover,
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
                                                            color: notesUi.icon,
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
                                                            color="primary"
                                                            sx={{ ml: 1, color: notesUi.icon }}
                                                        />
                                                        <IconButton
                                                            onClick={() => navigate(`/notes/${note.id}`)}
                                                            color="inherit"
                                                            size="small"
                                                            sx={{ ml: 1, color: notesUi.icon }}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => navigate(`/notes/${note.id}?edit=1`)}
                                                            color="inherit"
                                                            size="small"
                                                            sx={{ ml: 1, color: notesUi.icon }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                                            color="inherit"
                                                            size="small"
                                                            sx={{ ml: 1, color: notesUi.icon }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </AccordionSummary>
                                        </Box>
                                        <AccordionDetails sx={{ position: 'relative' }}>
                                            <Box
                                                sx={{
                                                    position: 'sticky',
                                                    top: 88,
                                                    zIndex: 3,
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    mb: 1,
                                                    pointerEvents: 'none',
                                                }}
                                            >
                                                <Tooltip title="Subir al inicio de esta nota" arrow placement="left">
                                                    <IconButton
                                                        size="medium"
                                                        aria-label="Subir al inicio de esta nota"
                                                        onClick={() => handleScrollToNoteTop(note.id)}
                                                        sx={{
                                                            pointerEvents: 'auto',
                                                            width: 36,
                                                            height: 36,
                                                            color: 'primary.contrastText',
                                                            border: '1px solid',
                                                            borderColor: 'primary.dark',
                                                            backgroundColor: 'primary.main',
                                                            boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                                                            '&:hover': {
                                                                backgroundColor: 'primary.dark',
                                                                transform: 'translateY(-1px)',
                                                            },
                                                        }}
                                                    >
                                                        <KeyboardArrowUpIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            <Box sx={{ mb: 2, overflowX: 'auto' }}>
                                                <ReactMarkdown
                                                    children={note.content}
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownRenderers}
                                                />
                                            </Box>
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
            <Zoom in={showGlobalScrollTop}>
                <Tooltip title="Subir al inicio" arrow placement="left">
                    <Fab
                        color="primary"
                        size="medium"
                        aria-label="Subir al inicio"
                        onClick={handleGlobalScrollToTop}
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1400,
                        }}
                    >
                        <KeyboardArrowUpIcon />
                    </Fab>
                </Tooltip>
            </Zoom>
        </Container>
    );
};

export default Notes; 