import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from './ProtectedRoute';

export const userRoutes = [
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  }
];