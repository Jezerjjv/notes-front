import React, { useState, useEffect, lazy, Suspense } from 'react';
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
    MenuItem,
    Fab,
    Zoom,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { notesService } from '../services/notesService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { projectsService } from '../services/projectsService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WysiwygMarkdownEditor = lazy(() => import('../components/WysiwygMarkdownEditor'));
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
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeText}</pre>
                    </Box>
                }
            >
                <CodeHighlighter language={language} codeText={codeText} />
            </Suspense>
        );
    },
};

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
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [openCodeDialog, setOpenCodeDialog] = useState(false);
    const [codeLanguage, setCodeLanguage] = useState('sql');
    const [codeText, setCodeText] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!isNew) {
                    const noteData = await notesService.getNote(id);
                    setNote(noteData);
                    setEditedTitle(noteData.title);
                    setEditedContent(noteData.content);
                    setEditedIsPublic(noteData.isPublic);

                    const isAdmin = user?.isAdmin === true || user?.isAdmin === 1;
                    const canEdit = !!user && (isAdmin || noteData.UserId === user.id);
                    const shouldOpenEdit = new URLSearchParams(location.search).get('edit') === '1';
                    if (shouldOpenEdit && canEdit) {
                        setIsEditing(true);
                    }
                }
                if (isNew) {
                    const projects = await projectsService.getAll();
                    setProjectList(projects);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                setError('Error al cargar los datos');
                setLoading(false);
            }
        };
        loadData();
    }, [id, isNew, location.search, user]);

    useEffect(() => {
        const onScroll = () => {
            setShowScrollTop(window.scrollY > 280);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const appendCodeBlock = () => {
        const trimmedCode = codeText.replace(/\s+$/, '');
        if (!trimmedCode) return;
        const fencedBlock = `\`\`\`${codeLanguage}\n${trimmedCode}\n\`\`\``;
        setEditedContent((current) => {
            const safeCurrent = current || '';
            if (!safeCurrent.trim()) return fencedBlock;
            return `${safeCurrent.trimEnd()}\n\n${fencedBlock}`;
        });
        setOpenCodeDialog(false);
        setCodeText('');
    };

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
                setEditedTitle(updatedNote.title || '');
                setEditedContent(updatedNote.content || '');
                setEditedIsPublic(!!updatedNote.isPublic);
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
                <Paper sx={{ p: 4, backgroundColor: 'background.paper', color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <IconButton 
                            onClick={() => navigate('/notes')}
                            sx={{ color: 'text.primary', mr: 2 }}
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
                        <Suspense fallback={<LoadingSpinner />}>
                            <WysiwygMarkdownEditor
                                value={editedContent}
                                onChange={setEditedContent}
                                height={420}
                            />
                        </Suspense>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" size="small" onClick={() => setOpenCodeDialog(true)}>
                                + Bloque de codigo
                            </Button>
                        </Box>
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
                            <Button variant="outlined" onClick={() => navigate('/notes')} sx={{ color: 'text.primary', borderColor: 'divider' }}>
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
                <CodeBlockDialog
                    open={openCodeDialog}
                    onClose={() => setOpenCodeDialog(false)}
                    codeLanguage={codeLanguage}
                    setCodeLanguage={setCodeLanguage}
                    codeText={codeText}
                    setCodeText={setCodeText}
                    onInsert={appendCodeBlock}
                />
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
        <Container maxWidth="lg" sx={{ mt: 4, pb: 10 }}>
            <Paper sx={{ p: 4, backgroundColor: 'background.paper', color: 'text.primary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton
                        onClick={() => navigate('/notes')}
                        sx={{ color: 'text.primary', mr: 2 }}
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
                                        sx={{ color: 'text.primary', borderColor: 'divider' }}
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
                                        onClick={() => {
                                            setEditedTitle(note?.title || '');
                                            setEditedContent(note?.content || '');
                                            setEditedIsPublic(!!note?.isPublic);
                                            setIsEditing(true);
                                        }}
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
                        <Suspense fallback={<LoadingSpinner />}>
                            <WysiwygMarkdownEditor
                                value={editedContent}
                                onChange={setEditedContent}
                                height={420}
                            />
                        </Suspense>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" size="small" onClick={() => setOpenCodeDialog(true)}>
                                + Bloque de codigo
                            </Button>
                        </Box>
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownRenderers}>
                            {note.content || ''}
                        </ReactMarkdown>
                        <Typography variant="body2" color="text.secondary">
                            {note.isPublic ? 'Nota Pública' : 'Nota Privada'}
                        </Typography>
                    </Box>
                )}
            </Paper>
            <Zoom in={showScrollTop}>
                <Fab
                    color="primary"
                    size="medium"
                    aria-label="Volver arriba"
                    onClick={handleScrollToTop}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1400,
                    }}
                >
                    <KeyboardArrowUpIcon />
                </Fab>
            </Zoom>
            <CodeBlockDialog
                open={openCodeDialog}
                onClose={() => setOpenCodeDialog(false)}
                codeLanguage={codeLanguage}
                setCodeLanguage={setCodeLanguage}
                codeText={codeText}
                setCodeText={setCodeText}
                onInsert={appendCodeBlock}
            />
        </Container>
    );
};

const CodeBlockDialog = ({
    open,
    onClose,
    codeLanguage,
    setCodeLanguage,
    codeText,
    setCodeText,
    onInsert,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Insertar bloque de codigo</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
                <InputLabel>Lenguaje</InputLabel>
                <Select
                    value={codeLanguage}
                    label="Lenguaje"
                    onChange={(e) => setCodeLanguage(e.target.value)}
                >
                    <MenuItem value="sql">SQL</MenuItem>
                    <MenuItem value="javascript">JavaScript</MenuItem>
                    <MenuItem value="typescript">TypeScript</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="bash">Bash</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="text">Texto plano</MenuItem>
                </Select>
            </FormControl>
            <TextField
                multiline
                minRows={10}
                label="Pega el codigo aqui"
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                inputProps={{ style: { fontFamily: 'Consolas, monospace' } }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="contained" onClick={onInsert} disabled={!codeText.trim()}>
                Insertar
            </Button>
        </DialogActions>
    </Dialog>
);

export default NoteDetail; 