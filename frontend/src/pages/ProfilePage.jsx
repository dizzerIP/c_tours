import { useEffect, useState } from 'react';

import { useAuth } from '../store/useAuth';

const roleLabels = {
  user: 'Пользователь',
  manager: 'Менеджер',
  admin: 'Администратор'
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage() {
  const {
    user,
    logout,
    updateProfile
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();

    if (normalizedFullName.length > 100) {
      setError('Имя не должно превышать 100 символов.');
      return;
    }

    if (
      normalizedEmail &&
      !EMAIL_PATTERN.test(normalizedEmail)
    ) {
      setError('Введите корректный адрес электронной почты.');
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await updateProfile({
        fullName: normalizedFullName,
        email: normalizedEmail
      });

      setMessage('Изменения сохранены.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setError('');
    setMessage('');
  }

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">
          Аккаунт c.tours
        </p>

        <h1>Личный кабинет</h1>
      </div>

      <article className="city-details">
        <h2>Мой профиль</h2>

        <dl className="profile-details">
          <div>
            <dt>Телефон</dt>
            <dd>{user.phoneNumber}</dd>
          </div>

          <div>
            <dt>Роль</dt>
            <dd>
              {roleLabels[user.role] || user.role}
            </dd>
          </div>
        </dl>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="form-field">
            <label htmlFor="full-name">
              Имя
            </label>

            <input
              id="full-name"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              maxLength={100}
              disabled={isSaving}
              placeholder="Иван Иванов"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">
              Электронная почта
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              maxLength={254}
              disabled={isSaving}
              placeholder="name@example.com"
            />
          </div>

          <div className="profile-actions">
            <button
              className="button"
              type="submit"
              disabled={isSaving}
            >
              {isSaving
                ? 'Сохраняем...'
                : 'Сохранить изменения'}
            </button>

            <button
              className="button button-secondary"
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Отменить
            </button>
          </div>
        </form>

        <button
          className="button button-secondary"
          type="button"
          onClick={logout}
        >
          Выйти
        </button>
      </article>

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
    </section>
  );
}