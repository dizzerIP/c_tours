import AdminCitiesPage from '../pages/AdminCitiesPage';
import ProtectedRoute from './ProtectedRoute';

export const adminRoutes = [
  {
    path: '/admin/cities',
    element: (
      <ProtectedRoute>
        <AdminCitiesPage />
      </ProtectedRoute>
    )
  }
];