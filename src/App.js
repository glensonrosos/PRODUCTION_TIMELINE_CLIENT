import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // Added AdminDashboardPage 
import SeasonDetailPage from './pages/SeasonDetailPage';
import CreateSeasonPage from './pages/CreateSeasonPage';
import PlannerDashboardPage from './pages/PlannerDashboardPage'; 
import ChangePasswordPage from './pages/ChangePasswordPage'; // Added ChangePasswordPage
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>; // Or a more sophisticated loader
  }

  return (
    <Routes>
      {/* Auth routes: Rendered if not authenticated, otherwise redirect to dashboard */}
      <Route element={!isAuthenticated ? <AuthLayout /> : <Navigate to="/dashboard" />}>
        <Route path="/login" element={<LoginPage />} />
        {/* Registration is now admin-only, route removed from public access */}
        {/* Add forgot password routes here if needed */}
      </Route>

      {/* Application routes: Protected and within MainLayout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/seasons/:seasonId" element={<SeasonDetailPage />} />
        <Route path="/seasons/new" element={<CreateSeasonPage />} />
        <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/planner-dashboard" element={<ProtectedRoute roles={['Planner', 'Admin']}><PlannerDashboardPage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        {/* Add other user-specific and admin routes here, e.g., /profile, /settings, /users, /departments */}
      </Route>

      {/* Fallback route: Redirect to dashboard if authenticated, else to login */}
      <Route 
        path="*" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;

