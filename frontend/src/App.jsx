import { NavLink } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes';
import { useAuth } from './store/useAuth';

export default function App() {
  const {
    user,
    isAuthenticated,
    logout,
    sessionError
  } = useAuth();

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/">
            c.tours
          </NavLink>

          <nav
            className="navigation"
            aria-label="Основная навигация"
          >
            <NavLink to="/" end>
              Главная
            </NavLink>

            <NavLink to="/cities">
              Города
            </NavLink>

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <NavLink to="/admin/cities">
                    Управление городами
                  </NavLink>
                )}

                <NavLink to="/profile">
                  {user.fullName || 'Личный кабинет'}
                </NavLink>

                <button
                  className="text-button"
                  type="button"
                  onClick={logout}
                >
                  Выйти
                </button>
              </>
            ) : (
              <NavLink to="/login">
                Войти
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        {sessionError && (
          <p className="form-error" role="alert">
            {sessionError}
          </p>
        )}

        <AppRoutes />
      </main>

      <footer className="site-footer">
        c.tours — проект системы управления туристическим бизнесом
      </footer>
    </div>
  );
}