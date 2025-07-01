

import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// import { DataContext } from './context/DataContext';
import { DataContext } from './src/context/DataContext';

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useContext(DataContext);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
