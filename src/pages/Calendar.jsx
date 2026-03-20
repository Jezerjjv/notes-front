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
import TodayIcon from '@mui/icons-material/Today';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
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
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [viewAllMonths, setViewAllMonths] = useState(false);
    const [yearLoading, setYearLoading] = useState(false);
    const [yearLoadError, setYearLoadError] = useState('');
    const [yearDayStatusByDate, setYearDayStatusByDate] = useState({});
    const [projects, setProjects] = useState([]);
    const [entriesByDate, setEntriesByDate] = useState({});
    const [dayStatusByDate, setDayStatusByDate] = useState({});
    const [monthLoading, setMonthLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [dayStatusDraft, setDayStatusDraft] = useState(DAY_STATUS.NORMAL);
    const [holidayNameDraft, setHolidayNameDraft] = useState('');
    const [savingDayStatus, setSavingDayStatus] = useState(false);
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

    useEffect(() => {
        if (!viewAllMonths) return;

        let cancelled = false;
        const loadYear = async () => {
            setYearLoading(true);
            setYearLoadError('');
            setYearDayStatusByDate({});

            try {
                const requests = Array.from({ length: 12 }, (_, idx) => calendarService.getMonth(currentYear, idx + 1));
                const results = await Promise.all(requests);

                if (cancelled) return;

                const merged = {};
                results.forEach((data) => {
                    const map = data?.dayStatusByDate;
                    if (!map || typeof map !== 'object') return;
                    Object.keys(map).forEach((key) => {
                        merged[key] = map[key];
                    });
                });

                setYearDayStatusByDate(merged);
            } catch (e) {
                const msg =
                    e.response?.data?.message ||
                    e.response?.data?.error ||
                    e.message ||
                    'No se pudo cargar el año completo';
                setYearLoadError(String(msg));
                setYearDayStatusByDate({});
            } finally {
                if (!cancelled) setYearLoading(false);
            }
        };

        void loadYear();

        return () => {
            cancelled = true;
        };
    }, [viewAllMonths, currentYear]);

    const monthMeta = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstWeekdayMondayStart = (firstDay.getDay() + 6) % 7;

        return { daysInMonth, firstWeekdayMondayStart };
    }, [currentMonth, currentYear]);

    const getMonthMetaFor = (year, monthIdx) => {
        const firstDay = new Date(year, monthIdx, 1);
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        const firstWeekdayMondayStart = (firstDay.getDay() + 6) % 7;
        return { daysInMonth, firstWeekdayMondayStart };
    };

    const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];

    const years = useMemo(() => {
        const start = currentYear - 5;
        return Array.from({ length: 11 }, (_, idx) => start + idx);
    }, [currentYear]);

    const handlePrevMonth = () => {
        setViewAllMonths(false);
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((prev) => prev - 1);
            return;
        }
        setCurrentMonth((prev) => prev - 1);
    };

    const handleNextMonth = () => {
        setViewAllMonths(false);
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((prev) => prev + 1);
            return;
        }
        setCurrentMonth((prev) => prev + 1);
    };

    const handleGoToToday = () => {
        setViewAllMonths(false);
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
    };

    const openDayDialog = (day) => {
        const dateKey = toDateKey(currentYear, currentMonth, day);
        setSelectedDate(dateKey);
        setModalOpen(true);
        setError('');
        setForm({ projectId: '', hours: '', description: '' });
        const dayObj = dayStatusByDate[dateKey] || null;
        setDayStatusDraft(dayObj?.status || DAY_STATUS.NORMAL);
        setHolidayNameDraft(dayObj?.holidayName || '');
    };

    const openDayDialogFromYear = (year, monthIdx, day) => {
        const dateKey = toDateKey(year, monthIdx, day);

        // Asegura que al guardar/recargar usemos el mes correcto.
        setCurrentYear(year);
        setCurrentMonth(monthIdx);

        setSelectedDate(dateKey);
        setModalOpen(true);
        setError('');
        setForm({ projectId: '', hours: '', description: '' });

        const dayObj = dayStatusByDate[dateKey] || yearDayStatusByDate[dateKey] || null;
        setDayStatusDraft(dayObj?.status || DAY_STATUS.NORMAL);
        setHolidayNameDraft(dayObj?.holidayName || '');
    };

    const closeDialog = () => {
        setModalOpen(false);
        setError('');
    };

    const handleSaveDayStatus = async () => {
        if (!selectedDate) return;
        if (savingDayStatus) return;
        setSavingDayStatus(true);
        setError('');
        try {
            const nameToSave =
                dayStatusDraft === DAY_STATUS.HOLIDAY ? holidayNameDraft.trim() || 'Festivo' : '';
            await calendarService.setDayStatus(selectedDate, dayStatusDraft, nameToSave);
            await refreshMonth();
            setModalOpen(false);
        } catch (e) {
            setError(
                e.response?.data?.message ||
                    e.response?.data?.error ||
                    'No se pudo guardar el estado del dia en el servidor'
            );
        } finally {
            setSavingDayStatus(false);
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
        const dayStatusObj = dayStatusByDate[dateKey] || null;
        const dayStatus = dayStatusObj?.status || DAY_STATUS.NORMAL;
        const holidayName = dayStatusObj?.holidayName || '';
        const dateObj = new Date(currentYear, currentMonth, day);
        dateObj.setHours(0, 0, 0, 0);
        const todayMidnight = new Date(today);
        todayMidnight.setHours(0, 0, 0, 0);
        const dayOfWeek = dateObj.getDay(); // 0=Dom, 6=Sab
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPast = dateObj < todayMidnight;
        const isGreyedPast = isPast && !isWeekend && dayStatus === DAY_STATUS.NORMAL;
        const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
        const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES_IN_DAY);
        const hiddenEntriesCount = Math.max(entries.length - MAX_VISIBLE_ENTRIES_IN_DAY, 0);
        const isToday =
            !isPast &&
            today.getFullYear() === currentYear &&
            today.getMonth() === currentMonth &&
            today.getDate() === day;

        const dayStatusStyles = {
            [DAY_STATUS.NORMAL]: {
                bgcolor: isWeekend ? 'rgba(218, 54, 51, 0.12)' : 'background.paper',
                borderColor: isToday ? 'success.main' : isWeekend ? 'error.main' : 'divider',
            },
            [DAY_STATUS.VACATION]: {
                bgcolor: 'rgba(245, 158, 11, 0.18)', // naranja
                borderColor: isWeekend ? 'error.main' : '#f59e0b',
            },
            [DAY_STATUS.HOLIDAY]: {
                bgcolor: 'rgba(210, 153, 34, 0.18)',
                borderColor: isWeekend ? 'error.main' : '#d29922',
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
                        ...(isGreyedPast
                            ? {
                                  bgcolor: 'rgba(177, 186, 196, 0.10)',
                                  borderColor: 'rgba(177, 186, 196, 0.35)',
                                  cursor: 'pointer',
                              }
                            : null),
                        ...(isToday && dayStatus === DAY_STATUS.NORMAL
                            ? { bgcolor: 'rgba(46, 160, 67, 0.14)', borderColor: 'success.main' }
                            : null),
                        ...(isToday && dayStatus !== DAY_STATUS.NORMAL ? { borderColor: 'success.main' } : null),
                        cursor: 'pointer',
                    }}
                >
                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    color: isGreyedPast
                                        ? 'text.secondary'
                                        : isToday
                                            ? 'success.main'
                                            : dayStatus === DAY_STATUS.VACATION
                                                ? '#f59e0b'
                                                : dayStatus === DAY_STATUS.HOLIDAY
                                                    ? '#d29922'
                                                    : isWeekend
                                                        ? 'error.main'
                                                        : 'inherit',
                                }}
                            >
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
                                {dayStatus === DAY_STATUS.HOLIDAY && holidayName && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                        {holidayName}
                                    </Typography>
                                )}
                            </>
                        ) : (
                            dayStatus === DAY_STATUS.VACATION ? (
                                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, display: 'block' }}>
                                    Vacaciones
                                </Typography>
                            ) : dayStatus === DAY_STATUS.HOLIDAY ? (
                                <Typography variant="caption" sx={{ color: '#d29922', fontWeight: 700, display: 'block' }}>
                                    {holidayName || 'Festivo'}
                                </Typography>
                            ) : (
                                <Typography variant="caption" color="text.secondary">
                                    Sin registros
                                </Typography>
                            )
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
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<TodayIcon />}
                        onClick={handleGoToToday}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Hoy
                    </Button>
                    <Button
                        variant={viewAllMonths ? 'contained' : 'outlined'}
                        size="small"
                        startIcon={<ViewModuleIcon />}
                        onClick={() => setViewAllMonths((v) => !v)}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {viewAllMonths ? 'Ver mes' : 'Ver meses'}
                    </Button>
                    {!viewAllMonths && (
                        <>
                            <IconButton onClick={handlePrevMonth} aria-label="mes anterior">
                                <ChevronLeftIcon />
                            </IconButton>
                            <Select
                                size="small"
                                value={currentMonth}
                                onChange={(event) => {
                                    setViewAllMonths(false);
                                    setCurrentMonth(Number(event.target.value));
                                }}
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
                                onChange={(event) => {
                                    setViewAllMonths(false);
                                    setCurrentYear(Number(event.target.value));
                                }}
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
                        </>
                    )}
                </Stack>
            </Box>

            {viewAllMonths ? (
                <Box
                    sx={{
                        border: '1px solid',
                        borderColor: '#30363d',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: '#161b22',
                    }}
                >
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                        Calendario completo {currentYear}
                    </Typography>

                    {yearLoadError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {yearLoadError}
                        </Alert>
                    )}

                    {yearLoading ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                            <LoadingSpinner />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: 1,
                            }}
                        >
                            {MONTHS.map((monthName, monthIdx) => {
                                const meta = getMonthMetaFor(currentYear, monthIdx);
                                const totalCells = meta.firstWeekdayMondayStart + meta.daysInMonth;
                                const fullCellCount = Math.ceil(totalCells / 7) * 7;

                                const isActive = monthIdx === currentMonth;

                                const cells = [];
                                for (let i = 0; i < fullCellCount; i += 1) {
                                    const dayNumber = i - meta.firstWeekdayMondayStart + 1;
                                    cells.push(dayNumber < 1 || dayNumber > meta.daysInMonth ? null : dayNumber);
                                }

                                const monthPrefix = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}-`;
                                const monthLines = Object.keys(yearDayStatusByDate)
                                    .filter((k) => k.startsWith(monthPrefix))
                                    .map((k) => {
                                        const dayNum = Number(k.slice(-2));
                                        const obj = yearDayStatusByDate[k];
                                        if (!obj || obj.status === DAY_STATUS.NORMAL) return null;

                                        const label =
                                            obj.status === DAY_STATUS.HOLIDAY ? obj.holidayName : 'Vacaciones';
                                        const color = obj.status === DAY_STATUS.HOLIDAY ? '#0369a1' : '#9a3412';

                                        if (!label) return null;
                                        return { key: k, dayNum, label, color };
                                    })
                                    .filter(Boolean)
                                    .sort((a, b) => a.dayNum - b.dayNum);

                                return (
                                    <Card
                                        key={monthName}
                                        variant="outlined"
                                        sx={{
                                            borderColor: isActive ? '#2f81f7' : '#30363d',
                                            bgcolor: isActive ? 'rgba(47, 129, 247, 0.10)' : '#161b22',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <CardContent sx={{ p: 1 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    color: '#c9d1d9',
                                                    cursor: 'pointer',
                                                    userSelect: 'none',
                                                    '&:hover': { textDecoration: 'underline' },
                                                }}
                                                onClick={() => {
                                                    setCurrentMonth(monthIdx);
                                                    setViewAllMonths(false);
                                                }}
                                            >
                                                {monthName}
                                            </Typography>

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                                    gap: 0.5,
                                                    mt: 1,
                                                }}
                                            >
                                                {WEEKDAYS.map((d) => (
                                                    <Typography
                                                        key={d}
                                                        variant="caption"
                                                        sx={{
                                                            textAlign: 'center',
                                                        color: d === 'Sab' || d === 'Dom' ? '#da3633' : '#8b949e',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {d}
                                                    </Typography>
                                                ))}
                                            </Box>

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                                                    gap: 0.5,
                                                    mt: 0.5,
                                                }}
                                            >
                                                {cells.map((day, cellIdx) => {
                                                    if (!day) {
                                                        return (
                                                            <Box
                                                                key={`empty-${monthIdx}-${cellIdx}`}
                                                                sx={{ width: '100%', aspectRatio: '1 / 1' }}
                                                            />
                                                        );
                                                    }

                                                    const dateKey = toDateKey(currentYear, monthIdx, day);
                                                    const dayObj = yearDayStatusByDate[dateKey] || null;
                                                    const status = dayObj?.status || DAY_STATUS.NORMAL;
                                                    const holidayName = dayObj?.holidayName || '';

                                                    const dateObj = new Date(currentYear, monthIdx, day);
                                                    dateObj.setHours(0, 0, 0, 0);

                                                    const isWeekend = (() => {
                                                        const dow = dateObj.getDay();
                                                        return dow === 0 || dow === 6;
                                                    })();
                                                    const isPast = dateObj < todayMidnight;
                                                    const isGreyedPast = isPast && !isWeekend && status === DAY_STATUS.NORMAL;

                                                    const isToday = dateKey === todayKey;

                                                    let bgcolor = '#161b22';
                                                    let borderColor = '#30363d';
                                                    let textColor = '#c9d1d9';

                                                    if (status === DAY_STATUS.VACATION) {
                                                        bgcolor = 'rgba(249, 115, 22, 0.18)';
                                                        borderColor = '#f97316';
                                                        textColor = '#9a3412';
                                                    } else if (status === DAY_STATUS.HOLIDAY) {
                                                        bgcolor = 'rgba(14, 165, 233, 0.18)'; // cyan suave
                                                        borderColor = '#0ea5e9';
                                                        textColor = '#0369a1';
                                                    } else {
                                                        if (isWeekend) {
                                                            bgcolor = 'rgba(239, 68, 68, 0.08)';
                                                            borderColor = '#ef4444';
                                                            textColor = '#ef4444';
                                                        }
                                                        if (isGreyedPast) {
                                                            bgcolor = 'rgba(177, 186, 196, 0.10)';
                                                            borderColor = 'rgba(177, 186, 196, 0.35)';
                                                            textColor = '#8b949e';
                                                        }
                                                    }

                                                    if (isToday) {
                                                        borderColor = '#16a34a';
                                                        textColor = '#16a34a';
                                                        bgcolor =
                                                            status === DAY_STATUS.NORMAL ? 'rgba(22, 163, 74, 0.12)' : bgcolor;
                                                    }

                                                    return (
                                                        <Box
                                                            key={dateKey}
                                                            role="button"
                                                            tabIndex={0}
                                                            title={
                                                                status === DAY_STATUS.HOLIDAY
                                                                    ? holidayName
                                                                    : status === DAY_STATUS.VACATION
                                                                        ? 'Vacaciones'
                                                                        : ''
                                                            }
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openDayDialogFromYear(currentYear, monthIdx, day);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.stopPropagation();
                                                                    openDayDialogFromYear(currentYear, monthIdx, day);
                                                                }
                                                            }}
                                                            sx={{
                                                                width: '100%',
                                                                aspectRatio: '1 / 1',
                                                                borderRadius: 1,
                                                                border: '1px solid',
                                                                borderColor,
                                                                bgcolor,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                '&:focus': { outline: 'none', boxShadow: 'none' },
                                                                '&:focus-visible': { outline: 'none', boxShadow: 'none' },
                                                                boxSizing: 'border-box',
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ fontWeight: 700, fontSize: '0.68rem', color: textColor, lineHeight: 1 }}
                                                            >
                                                                {day}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>

                                            {monthLines.length > 0 && (
                                                <Stack spacing={0.25} sx={{ mt: 1 }}>
                                                    {monthLines.map((line) => (
                                                        <Typography
                                                            key={line.key}
                                                            variant="caption"
                                                            sx={{
                                                                color: line.color,
                                                                fontSize: '0.68rem',
                                                                lineHeight: 1.1,
                                                            }}
                                                        >
                                                            {String(line.dayNum).padStart(2, '0')} de {monthName.toLowerCase()} - {line.label}
                                                        </Typography>
                                                    ))}
                                                </Stack>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            mb: 1,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr)) minmax(120px, 120px)',
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
                                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr)) minmax(120px, 120px)',
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
                                                bgcolor: 'rgba(177, 186, 196, 0.08)',
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
                </>
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
                                value={dayStatusDraft}
                                onChange={(event) => setDayStatusDraft(event.target.value)}
                            >
                                <MenuItem value={DAY_STATUS.NORMAL}>Jornada normal</MenuItem>
                                <MenuItem value={DAY_STATUS.VACATION}>Vacaciones</MenuItem>
                                <MenuItem value={DAY_STATUS.HOLIDAY}>Festivo</MenuItem>
                            </Select>
                        </Box>

                        {dayStatusDraft === DAY_STATUS.HOLIDAY && (
                            <TextField
                                label="Nombre del festivo"
                                value={holidayNameDraft}
                                onChange={(event) => setHolidayNameDraft(event.target.value)}
                                fullWidth
                                size="small"
                            />
                        )}

                        <Button variant="outlined" onClick={handleSaveDayStatus} disabled={savingDayStatus}>
                            {savingDayStatus ? 'Guardando...' : 'Guardar estado del dia'}
                        </Button>

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
