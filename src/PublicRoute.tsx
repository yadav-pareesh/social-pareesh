import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

export const PublicRoute = () => {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};