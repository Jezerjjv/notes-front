import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { projectsService } from '../services/projectsService';
import { calendarService } from '../services/calendarService';
import LoadingSpinner from '../components/LoadingSpinner';

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const toDateKey = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const MAX_VISIBLE_ENTRIES_IN_DAY = 2;
const DAY_STATUS = {
    NORMAL: 'normal',
    VACATION: 'vacaciones',
    HOLIDAY: 'festivo',
};

const Calendar = () => {
    const { user } = useAuth();
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [projects, setProjects] = useState([]);
    const [entriesByDate, setEntriesByDate] = useState({});
    const [dayStatusByDate, setDayStatusByDate] = useState({});
    const [monthLoading, setMonthLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        projectId: '',
        hours: '',
        description: '',
    });

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const allProjects = await projectsService.getAll();
                setProjects(allProjects);
            } catch (loadError) {
                setProjects([]);
            }
        };

        loadProjects();
    }, []);

    const refreshMonth = useCallback(async () => {
        if (!user) {
            setEntriesByDate({});
            setDayStatusByDate({});
            setMonthLoading(false);
            return;
        }
        setMonthLoading(true);
        setLoadError('');
        try {
            const data = await calendarService.getMonth(currentYear, currentMonth + 1);
            setEntriesByDate(data.entriesByDate && typeof data.entriesByDate === 'object' ? data.entriesByDate : {});
            setDayStatusByDate(
                data.dayStatusByDate && typeof data.dayStatusByDate === 'object' ? data.dayStatusByDate : {}
            );
        } catch (e) {
            const msg =
                e.response?.data?.message ||
                e.response?.data?.error ||
                e.message ||
                'No se pudo cargar el calendario desde el servidor';
            setLoadError(String(msg));
            setEntriesByDate({});
            setDayStatusByDate({});
        } finally {
            setMonthLoading(false);
        }
    }, [user, currentYear, currentMonth]);

    useEffect(() => {
        refreshMonth();
    }, [refreshMonth]);

    const monthMeta = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstWeekdayMondayStart = (firstDay.getDay() + 6) % 7;

        return { daysInMonth, firstWeekdayMondayStart };
    }, [currentMonth, currentYear]);

    const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];
    const selectedDayStatus = selectedDate ? dayStatusByDate[selectedDate] || DAY_STATUS.NORMAL : DAY_STATUS.NORMAL;

    const years = useMemo(() => {
        const start = currentYear - 5;
        return Array.from({ length: 11 }, (_, idx) => start + idx);
    }, [currentYear]);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((prev) => prev - 1);
            return;
        }
        setCurrentMonth((prev) => prev - 1);
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((prev) => prev + 1);
            return;
        }
        setCurrentMonth((prev) => prev + 1);
    };

    const openDayDialog = (day) => {
        const dateKey = toDateKey(currentYear, currentMonth, day);
        setSelectedDate(dateKey);
        setModalOpen(true);
        setError('');
        setForm({ projectId: '', hours: '', description: '' });
    };

    const closeDialog = () => {
        setModalOpen(false);
        setError('');
    };

    const handleChangeDayStatus = async (newStatus) => {
        if (!selectedDate) return;
        setError('');
        try {
            await calendarService.setDayStatus(selectedDate, newStatus);
            await refreshMonth();
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    e.response?.data?.error ||
                    'No se pudo guardar el estado del dia en el servidor'
            );
        }
    };

    const handleAddEntry = async () => {
        if (!selectedDate) return;

        const parsedHours = Number(form.hours);
        if (!form.projectId) {
            setError('Selecciona un proyecto');
            return;
        }
        if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
            setError('Las horas deben ser mayores a 0');
            return;
        }

        setError('');
        try {
            await calendarService.createEntry({
                workDate: selectedDate,
                projectId: form.projectId,
                hours: parsedHours,
                description: form.description.trim(),
            });
            setForm({ projectId: '', hours: '', description: '' });
            await refreshMonth();
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    e.response?.data?.error ||
                    'No se pudo guardar el registro en el servidor'
            );
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!selectedDate) return;
        setError('');
        try {
            await calendarService.deleteEntry(entryId);
            await refreshMonth();
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    e.response?.data?.error ||
                    'No se pudo eliminar el registro en el servidor'
            );
        }
    };

    const renderDayCell = (day) => {
        const dateKey = toDateKey(currentYear, currentMonth, day);
        const entries = entriesByDate[dateKey] || [];
        const dayStatus = dayStatusByDate[dateKey] || DAY_STATUS.NORMAL;
        const dateObj = new Date(currentYear, currentMonth, day);
        const dayOfWeek = dateObj.getDay(); // 0=Dom, 6=Sab
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
        const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES_IN_DAY);
        const hiddenEntriesCount = Math.max(entries.length - MAX_VISIBLE_ENTRIES_IN_DAY, 0);
        const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === day;

        const dayStatusStyles = {
            [DAY_STATUS.NORMAL]: {
                bgcolor: isWeekend ? 'rgba(218, 54, 51, 0.12)' : 'background.paper',
                borderColor: isToday ? 'primary.main' : isWeekend ? 'error.main' : 'divider',
            },
            [DAY_STATUS.VACATION]: {
                bgcolor: 'rgba(35, 134, 54, 0.18)',
                borderColor: isToday ? 'primary.main' : isWeekend ? 'error.main' : '#238636',
            },
            [DAY_STATUS.HOLIDAY]: {
                bgcolor: 'rgba(210, 153, 34, 0.18)',
                borderColor: isToday ? 'primary.main' : isWeekend ? 'error.main' : '#d29922',
            },
        };

        return (
            <Box key={dateKey}>
                <Card
                    variant="outlined"
                    onClick={() => openDayDialog(day)}
                    sx={{
                        minHeight: 130,
                        ...dayStatusStyles[dayStatus],
                        cursor: 'pointer',
                    }}
                >
                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isWeekend ? 'error.main' : 'inherit' }}>
                                {day}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    openDayDialog(day);
                                }}
                                aria-label="agregar registro"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        {entries.length > 0 ? (
                            <>
                                <Stack spacing={0.25} sx={{ mb: 0.75 }}>
                                    {visibleEntries.map((entry) => (
                                        <Typography
                                            key={entry.id}
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {entry.projectName} - {entry.hours} h
                                        </Typography>
                                    ))}
                                    {hiddenEntriesCount > 0 && (
                                        <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                            +{hiddenEntriesCount} mas
                                        </Typography>
                                    )}
                                </Stack>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Total horas: {totalHours}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                Sin registros
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    };

    const buildCalendarWeeks = () => {
        const totalCells = monthMeta.firstWeekdayMondayStart + monthMeta.daysInMonth;
        const fullCellCount = Math.ceil(totalCells / 7) * 7;
        const cells = [];
        for (let index = 0; index < fullCellCount; index += 1) {
            const dayNumber = index - monthMeta.firstWeekdayMondayStart + 1;
            if (dayNumber < 1 || dayNumber > monthMeta.daysInMonth) {
                cells.push(null);
            } else {
                cells.push(dayNumber);
            }
        }

        const rows = [];
        for (let index = 0; index < cells.length; index += 7) {
            rows.push(cells.slice(index, index + 7));
        }
        return rows;
    };

    const calendarWeeks = buildCalendarWeeks();

    const getWeekTotalHours = (weekDays) => {
        return weekDays.reduce((sum, day) => {
            if (!day) return sum;
            const dateKey = toDateKey(currentYear, currentMonth, day);
            const dayEntries = entriesByDate[dateKey] || [];
            const dayTotal = dayEntries.reduce((acc, entry) => acc + Number(entry.hours || 0), 0);
            return sum + dayTotal;
        }, 0);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h4" color="text.primary">
                    Calendario de Horas
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <IconButton onClick={handlePrevMonth} aria-label="mes anterior">
                        <ChevronLeftIcon />
                    </IconButton>
                    <Select
                        size="small"
                        value={currentMonth}
                        onChange={(event) => setCurrentMonth(Number(event.target.value))}
                    >
                        {MONTHS.map((monthName, idx) => (
                            <MenuItem value={idx} key={monthName}>
                                {monthName}
                            </MenuItem>
                        ))}
                    </Select>
                    <Select
                        size="small"
                        value={currentYear}
                        onChange={(event) => setCurrentYear(Number(event.target.value))}
                    >
                        {years.map((year) => (
                            <MenuItem value={year} key={year}>
                                {year}
                            </MenuItem>
                        ))}
                    </Select>
                    <IconButton onClick={handleNextMonth} aria-label="mes siguiente">
                        <ChevronRightIcon />
                    </IconButton>
                </Stack>
            </Box>

            <Box
                sx={{
                    mb: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                    gap: 1,
                }}
            >
                {WEEKDAYS.map((day) => (
                    <Box key={day}>
                        <Box sx={{ py: 1, textAlign: 'center' }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 700,
                                    color: day === 'Sab' || day === 'Dom' ? 'error.main' : 'text.secondary',
                                }}
                            >
                                {day}
                            </Typography>
                        </Box>
                    </Box>
                ))}
                <Box>
                    <Box sx={{ py: 1, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Total sem.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {loadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {loadError}
                    {' — '}
                    Comprueba que el backend esté desplegado y que hayas ejecutado la migración SQL en la base de datos
                    (notes-back/migrations/001_calendar.sql).
                </Alert>
            )}

            {monthLoading ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <LoadingSpinner />
                </Box>
            ) : (
            <Stack spacing={1}>
                {calendarWeeks.map((weekDays, rowIndex) => {
                    const weekTotal = getWeekTotalHours(weekDays);
                    return (
                        <Box
                            key={`week-${rowIndex}`}
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                                gap: 1,
                            }}
                        >
                            {weekDays.map((day, colIndex) =>
                                day ? (
                                    renderDayCell(day)
                                ) : (
                                    <Box key={`empty-${rowIndex}-${colIndex}`}>
                                        <Box sx={{ minHeight: 130 }} />
                                    </Box>
                                )
                            )}
                            <Card
                                variant="outlined"
                                sx={{
                                    minHeight: 130,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Semana
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {weekTotal}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        horas
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Stack>
            )}

            <Dialog open={modalOpen} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Registros del dia {selectedDate}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <Select
                            value={form.projectId}
                            onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
                            displayEmpty
                            size="small"
                        >
                            <MenuItem value="">
                                <em>Selecciona proyecto</em>
                            </MenuItem>
                            {projects.map((project) => (
                                <MenuItem key={project.id} value={project.id}>
                                    {project.name}
                                </MenuItem>
                            ))}
                        </Select>

                        <TextField
                            size="small"
                            label="Horas"
                            type="number"
                            inputProps={{ min: 0, step: 0.25 }}
                            value={form.hours}
                            onChange={(event) => setForm((prev) => ({ ...prev, hours: event.target.value }))}
                        />

                        <TextField
                            label="Detalle (opcional)"
                            multiline
                            minRows={2}
                            value={form.description}
                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        />

                        <Button variant="contained" onClick={handleAddEntry}>
                            Guardar registro
                        </Button>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Estado del dia
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={selectedDayStatus}
                                onChange={(event) => {
                                    void handleChangeDayStatus(event.target.value);
                                }}
                            >
                                <MenuItem value={DAY_STATUS.NORMAL}>Jornada normal</MenuItem>
                                <MenuItem value={DAY_STATUS.VACATION}>Vacaciones</MenuItem>
                                <MenuItem value={DAY_STATUS.HOLIDAY}>Festivo</MenuItem>
                            </Select>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Registros guardados
                            </Typography>
                            <Stack spacing={1}>
                                {selectedEntries.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        Aun no hay registros para este dia.
                                    </Typography>
                                )}
                                {selectedEntries.map((entry) => (
                                    <Card key={entry.id} variant="outlined">
                                        <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {entry.projectName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {entry.hours} h
                                                    </Typography>
                                                    {entry.description && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {entry.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteEntry(entry.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Calendar;
