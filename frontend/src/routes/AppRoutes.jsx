import { useRoutes } from 'react-router-dom';

import { publicRoutes } from './publicRoutes';
import { userRoutes } from './userRoutes';
import { adminRoutes } from './adminRoutes';

export default function AppRoutes() {
  return useRoutes([
    ...publicRoutes,
    ...userRoutes,
    ...adminRoutes
  ]);
}