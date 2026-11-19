import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../store/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    isLoading,
    completeLogin
  } = useAuth();

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('+7');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!resendAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendAt]);

  const secondsLeft = Math.max(
    0,
    Math.ceil((resendAt - now) / 1000)
  );

  async function requestCode() {
    if (!/^\+7\d{10}$/.test(phone)) {
      setError('Введите номер в формате +79991234567.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await sendOtp(phone);

      const currentTime = Date.now();

      setNow(currentTime);
      setResendAt(
        currentTime + result.resendAfterSeconds * 1000
      );

      setStep('code');
      setCode('');

      setMessage(
        'Код создан. В локальном режиме посмотрите его ' +
        'в терминале backend.'
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(event) {
    event.preventDefault();
    await requestCode();
  }

  async function handleCodeSubmit(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError('Введите 6 цифр кода.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await verifyOtp(phone, code);

      await completeLogin(result);

      navigate('/profile', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function changePhone() {
    setStep('phone');
    setCode('');
    setError('');
    setMessage('');
  }

  if (isLoading) {
    return (
      <p className="status-panel" role="status">
        Проверяем сессию...
      </p>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <p className="eyebrow">
          Личный кабинет c.tours
        </p>

        <h1>Вход по телефону</h1>

        <p className="auth-description">
          Пароль не нужен. Используйте одноразовый код.
        </p>

        <div className="development-notice">
          Тестовый режим: SMS на телефон не отправляются.
          Код выводится в терминале backend.
          Используйте демонстрационный номер.
        </div>

        {step === 'phone' ? (
          <form
            onSubmit={handlePhoneSubmit}
            className="auth-form"
          >
            <div className="form-field">
              <label htmlFor="phone">
                Номер телефона
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+79991234567"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
                disabled={loading}
                maxLength={12}
                pattern="[+]7[0-9]{10}"
                aria-describedby="phone-hint"
                required
              />

              <span
                id="phone-hint"
                className="field-hint"
              >
                Формат: +7 и ещё 10 цифр, без пробелов.
              </span>
            </div>

            <button
              className="button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Запрашиваем код...'
                : 'Получить код'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleCodeSubmit}
            className="auth-form"
          >
            <p>
              Номер: <strong>{phone}</strong>
            </p>

            <div className="form-field">
              <label htmlFor="otp-code">
                Код подтверждения
              </label>

              <input
                id="otp-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(event) => {
                  setCode(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6)
                  );
                }}
                maxLength={6}
                pattern="[0-9]{6}"
                disabled={loading}
                aria-describedby="code-hint"
                required
              />

              <span
                id="code-hint"
                className="field-hint"
              >
                Код действует 2 минуты.
              </span>
            </div>

            <button
              className="button"
              type="submit"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </button>

            <button
              className="button button-secondary"
              type="button"
              onClick={requestCode}
              disabled={loading || secondsLeft > 0}
            >
              {secondsLeft > 0
                ? `Новый код через ${secondsLeft} сек.`
                : 'Запросить новый код'}
            </button>

            <button
              className="text-button"
              type="button"
              onClick={changePhone}
              disabled={loading}
            >
              Изменить номер
            </button>
          </form>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}