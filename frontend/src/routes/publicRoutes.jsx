import HomePage from '../pages/HomePage';
import CitiesPage from '../pages/CitiesPage';
import CityPage from '../pages/CityPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';

export const publicRoutes = [
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/cities',
    element: <CitiesPage />
  },
  {
    path: '/cities/:cityId',
    element: <CityPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];