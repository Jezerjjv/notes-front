import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Login from './components/Login';
import Register from './components/Register';
import Notes from './pages/Notes';
import Projects from './pages/Projects';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import theme from './theme';
import NoteDetail from './pages/NoteDetail';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent = () => {
  const { user } = useAuth();

  return (
    <Router>
      {user && <Navbar />}
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
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

const App = () => {
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
