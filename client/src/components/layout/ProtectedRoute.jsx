import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FullPageSpinner } from '../ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isFirstLogin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isFirstLogin && location.pathname !== '/change-password') {
    // Force password change on first login
    return <Navigate to="/change-password" replace />;
  }

  if (!isFirstLogin && location.pathname === '/change-password') {
    // Don't allow accessing change-password if not required (unless from settings, but this route is for the forced one)
    // For standard password change from settings, we can use a different modal or component.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
