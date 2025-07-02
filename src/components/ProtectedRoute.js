import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can return a loading spinner here if you have one
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for role-based access if roles prop is provided
  if (roles && roles.length > 0) {
    const userHasRequiredRole = user && roles.includes(user.role);
    if (!userHasRequiredRole) {
      // Redirect to an unauthorized page or dashboard if role doesn't match
      // For now, let's redirect to a generic 'unauthorized' path or home
      // You might want to create a specific '/unauthorized' page
      return <Navigate to="/" state={{ from: location }} replace />;
      // Or show a message: return <div>Access Denied. You do not have the required role.</div>;
    }
  }

  return children;
};

export default ProtectedRoute;
