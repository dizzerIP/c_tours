import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  refreshSession,
  logoutSession
} from '../api/auth';

import { updateMyProfile } from '../api/users';

import { AuthContext } from './authContext';

function buildSession(data) {
  if (
    !data?.accessToken ||
    !data?.user?.userId ||
    !Number.isFinite(data.expiresInSeconds) ||
    data.expiresInSeconds <= 0
  ) {
    throw new Error('Некорректный ответ авторизации');
  }

  return {
    accessToken: data.accessToken,
    user: data.user,
    expiresAt: Date.now() + data.expiresInSeconds * 1000
  };
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const revision = useRef(0);

  const completeLogin = useCallback(async (data) => {
    const nextSession = buildSession(data);

    revision.current += 1;

    setSession(nextSession);
    setSessionError('');
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setSessionError('');

    try {
      await logoutSession();

      revision.current += 1;
      setSession(null);
    } catch {
      setSessionError(
        'Не удалось завершить сессию на сервере. ' +
        'Проверьте соединение и повторите выход.'
      );
    }
  }, []);

  const updateProfile = useCallback(
    async ({ fullName, email }) => {
      if (!session?.accessToken) {
        throw new Error(
          'Сессия не найдена. Войдите повторно.'
        );
      }

      const updatedUser = await updateMyProfile({
        token: session.accessToken,
        fullName,
        email
      });

      revision.current += 1;

      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        return {
          ...currentSession,
          user: {
            ...currentSession.user,
            fullName: updatedUser.fullName,
            email: updatedUser.email
          }
        };
      });

      return updatedUser;
    },
    [session]
  );

  useEffect(() => {
    let cancelled = false;
    const currentRevision = revision.current;

    async function restore() {
      try {
        const data = await refreshSession();

        if (
          !cancelled &&
          currentRevision === revision.current
        ) {
          setSession(buildSession(data));
          setSessionError('');
        }
      } catch (error) {
        if (
          !cancelled &&
          currentRevision === revision.current
        ) {
          setSession(null);

          if (error.status !== 401) {
            setSessionError(
              'Не удалось восстановить вход. ' +
              'Проверьте подключение к серверу.'
            );
          }
        }
      } finally {
        if (
          !cancelled &&
          currentRevision === revision.current
        ) {
          setIsLoading(false);
        }
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    let pending = false;
    const currentRevision = revision.current;

    async function renew() {
      if (pending || cancelled) {
        return;
      }

      pending = true;

      try {
        const data = await refreshSession();

        if (
          !cancelled &&
          currentRevision === revision.current
        ) {
          setSession(buildSession(data));
          setSessionError('');
        }
      } catch (error) {
        if (
          !cancelled &&
          currentRevision === revision.current
        ) {
          if (
            error.status === 401 ||
            Date.now() >= session.expiresAt
          ) {
            setSession(null);
          }

          setSessionError(
            'Не удалось обновить сессию. ' +
            'Если вход завершился, войдите повторно.'
          );
        }
      } finally {
        pending = false;
      }
    }

    function checkExpiration() {
      if (Date.now() >= session.expiresAt - 30_000) {
        void renew();
      }
    }

    const timer = window.setTimeout(
      checkExpiration,
      Math.max(0, session.expiresAt - Date.now() - 30_000)
    );

    const interval = window.setInterval(
      checkExpiration,
      30_000
    );

    window.addEventListener('focus', checkExpiration);
    window.addEventListener('online', checkExpiration);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);
      window.clearInterval(interval);

      window.removeEventListener('focus', checkExpiration);
      window.removeEventListener('online', checkExpiration);
    };
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        accessToken: session?.accessToken ?? null,
        isAuthenticated: session !== null,
        isLoading,
        sessionError,
        completeLogin,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}