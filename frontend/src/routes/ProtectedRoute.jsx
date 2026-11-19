import { Navigate } from 'react-router-dom';

import { useAuth } from '../store/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <p className="status-panel" role="status">
        Проверяем сессию...
      </p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}