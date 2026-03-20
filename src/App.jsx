import React, { Suspense, lazy, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { createAppTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Notes = lazy(() => import('./pages/Notes'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const Admin = lazy(() => import('./pages/Admin'));
const Calendar = lazy(() => import('./pages/Calendar'));

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      {user && <Navbar />}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notes" element={
            <PrivateRoute>
              <Notes />
            </PrivateRoute>
          } />
          <Route path="/notes/:id" element={
            <PrivateRoute>
              <NoteDetail />
            </PrivateRoute>
          } />
          <Route path="/notes/new" element={
            <PrivateRoute requireAdmin>
              <NoteDetail />
            </PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute requireAdmin>
              <Projects />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute requireAdmin>
              <Admin />
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute>
              <Calendar />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

const App = () => {
  const theme = useMemo(() => createAppTheme(), []);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
