import React from 'react';
import { Navigate } from 'react-router';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
