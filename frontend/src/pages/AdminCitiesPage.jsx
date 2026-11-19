import { useEffect, useState } from 'react';

import {
  getAdminCities,
  createCity,
  updateCity
} from '../api/adminCities';

import { useAuth } from '../store/useAuth';

import '../styles/adminCities.css';

const emptyForm = {
  cityId: '',
  nameRu: '',
  description: '',
  countryId: '',
  latitude: '',
  longitude: '',
  isActive: true
};

export default function AdminCitiesPage() {
  const { accessToken, user } = useAuth();

  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadCities() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getAdminCities(accessToken);

      setCities(data.cities);
      setCountries(data.countries);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === 'admin' && accessToken) {
      void loadCities();
    }
  }, [accessToken, user?.role]);

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function startCreate() {
    setForm(emptyForm);
    setError('');
    setMessage('');
  }

  function startEdit(city) {
    setForm({
      cityId: city.cityId,
      nameRu: city.nameRu || '',
      description: city.description || '',
      countryId: city.countryId || '',
      latitude:
        city.latitude === null ? '' : String(city.latitude),
      longitude:
        city.longitude === null
          ? ''
          : String(city.longitude),
      isActive: city.isActive === 1
    });

    setError('');
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      if (form.cityId) {
        await updateCity({
          token: accessToken,
          cityId: form.cityId,
          nameRu: form.nameRu,
          description: form.description,
          countryId: form.countryId,
          latitude: form.latitude,
          longitude: form.longitude,
          isActive: form.isActive
        });

        setMessage('Город обновлён.');
      } else {
        await createCity({
          token: accessToken,
          nameRu: form.nameRu,
          description: form.description,
          countryId: form.countryId,
          latitude: form.latitude,
          longitude: form.longitude
        });

        setMessage('Город создан.');
      }

      setForm(emptyForm);
      await loadCities();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCity(city) {
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await updateCity({
        token: accessToken,
        cityId: city.cityId,
        nameRu: city.nameRu,
        description: city.description || '',
        countryId: city.countryId,
        latitude:
          city.latitude === null ? '' : String(city.latitude),
        longitude:
          city.longitude === null
            ? ''
            : String(city.longitude),
        isActive: city.isActive !== 1
      });

      setMessage(
        city.isActive === 1
          ? 'Город скрыт.'
          : 'Город снова опубликован.'
      );

      await loadCities();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (user?.role !== 'admin') {
    return (
      <section className="admin-page">
        <div className="admin-empty">
          <h1>Доступ запрещён</h1>

          <p>
            Управление городами доступно только администратору.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">
            Администрирование c.tours
          </p>

          <h1>Управление городами</h1>

          <p className="admin-subtitle">
            Добавляйте города, редактируйте информацию
            и управляйте публикацией.
          </p>
        </div>

        <button
          className="admin-primary-button"
          type="button"
          onClick={startCreate}
          disabled={isSaving}
        >
          Новый город
        </button>
      </div>

      {isLoading ? (
        <div className="admin-empty">
          <p>Загружаем города...</p>
        </div>
      ) : (
        <div className="admin-layout">
          <form
            onSubmit={handleSubmit}
            className="admin-form-card"
          >
            <h2>
              {form.cityId
                ? 'Редактирование города'
                : 'Новый город'}
            </h2>

            <div className="admin-field">
              <label htmlFor="city-name">
                Название города
              </label>

              <input
                id="city-name"
                name="nameRu"
                type="text"
                value={form.nameRu}
                onChange={handleInputChange}
                maxLength={120}
                disabled={isSaving}
                placeholder="Например: Санкт-Петербург"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="city-country">
                Страна
              </label>

              <select
                id="city-country"
                name="countryId"
                value={form.countryId}
                onChange={handleInputChange}
                disabled={isSaving}
                required
              >
                <option value="">
                  Выберите страну
                </option>

                {countries.map((country) => (
                  <option
                    key={country.countryId}
                    value={country.countryId}
                  >
                    {country.nameRu}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="city-description">
                Описание
              </label>

              <textarea
                id="city-description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                maxLength={2000}
                rows={6}
                disabled={isSaving}
                placeholder="Кратко расскажите, чем интересен город"
              />
            </div>

            <div className="admin-coordinate-grid">
              <div className="admin-field">
                <label htmlFor="city-latitude">
                  Широта
                </label>

                <input
                  id="city-latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="59.9386"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="city-longitude">
                  Долгота
                </label>

                <input
                  id="city-longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="30.3141"
                />
              </div>
            </div>

            {form.cityId && (
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  disabled={isSaving}
                />

                <span>Город опубликован</span>
              </label>
            )}

            <div className="admin-form-actions">
              <button
                className="admin-primary-button"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Сохраняем...'
                  : form.cityId
                    ? 'Сохранить изменения'
                    : 'Создать город'}
              </button>

              {form.cityId && (
                <button
                  className="admin-secondary-button"
                  type="button"
                  onClick={startCreate}
                  disabled={isSaving}
                >
                  Отменить
                </button>
              )}
            </div>
          </form>

          <div className="admin-list-column">
            <div className="admin-list-header">
              <h2>Все города</h2>

              <span className="admin-count">
                {cities.length}
              </span>
            </div>

            {cities.length === 0 ? (
              <div className="admin-empty">
                <p>
                  Города пока не добавлены.
                  Создайте первый город в форме слева.
                </p>
              </div>
            ) : (
              <ul className="admin-city-list">
                {cities.map((city) => (
                  <li
                    key={city.cityId}
                    className="admin-city-card"
                  >
                    <div className="admin-city-info">
                      <div className="admin-city-title">
                        <h3>{city.nameRu}</h3>

                        <span
                          className={
                            city.isActive === 1
                              ? 'admin-status admin-status-active'
                              : 'admin-status admin-status-hidden'
                          }
                        >
                          {city.isActive === 1
                            ? 'Опубликован'
                            : 'Скрыт'}
                        </span>
                      </div>

                      <p className="admin-city-country">
                        {city.countryName}
                      </p>

                      {city.description && (
                        <p className="admin-city-description">
                          {city.description}
                        </p>
                      )}
                    </div>

                    <div className="admin-city-actions">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={() => startEdit(city)}
                        disabled={isSaving}
                      >
                        Редактировать
                      </button>

                      <button
                        className="admin-ghost-button"
                        type="button"
                        onClick={() => toggleCity(city)}
                        disabled={isSaving}
                      >
                        {city.isActive === 1
                          ? 'Скрыть'
                          : 'Опубликовать'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="admin-alert admin-alert-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-alert admin-alert-success" role="status">
          {message}
        </p>
      )}
    </section>
  );
}