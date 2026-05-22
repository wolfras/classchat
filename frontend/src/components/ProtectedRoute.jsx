import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdmin }) => {
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;