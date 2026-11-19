import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getCities } from '../api/cities';

export default function CitiesPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      setLoading(true);
      setError('');

      try {
        const data = await getCities({
          signal: controller.signal
        });

        if (!controller.signal.aborted) {
          setCities(data);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCities();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Направления</p>
        <h1>Города для вашего путешествия</h1>
        <p>Доступные города загружаются из базы данных.</p>
      </div>

      {loading ? (
        <p className="status-panel" role="status">
          Загружаем города...
        </p>
      ) : error ? (
        <div className="status-panel status-panel-error" role="alert">
          <p>Не удалось загрузить города: {error}</p>

          <button
            className="button"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Повторить
          </button>
        </div>
      ) : cities.length === 0 ? (
        <p className="status-panel">
          Пока нет доступных городов.
        </p>
      ) : (
        <div className="cards">
          {cities.map((city) => (
            <article className="card" key={city.cityId}>
                <span className="card-label">
                    {city.countryName}
                </span>

                <h2>{city.nameRu}</h2>

                <p>
                    {city.description || 'Описание скоро появится.'}
                </p>

                <Link
                    className="card-link"
                    to={`/cities/${city.cityId}`}
                >
                    Подробнее о городе
                    <span className="visually-hidden">
                        {' '}{city.nameRu}
                    </span>
                </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}