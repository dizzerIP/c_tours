import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getCityById } from '../api/cities';

export default function CityPage() {
  const { cityId } = useParams();

  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCity() {
      setLoading(true);
      setError('');
      setCity(null);

      try {
        const data = await getCityById(cityId, {
          signal: controller.signal
        });

        if (!controller.signal.aborted) {
          setCity(data);
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

    loadCity();

    return () => {
      controller.abort();
    };
  }, [cityId, reloadKey]);

  return (
    <section>
      <Link className="back-link" to="/cities">
        Вернуться к городам
      </Link>

      {loading ? (
        <p className="status-panel" role="status">
          Загружаем информацию о городе...
        </p>
      ) : error ? (
        <div className="status-panel status-panel-error" role="alert">
          <h1>Не удалось открыть город</h1>

          <p>{error}</p>

          <button
            className="button"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Повторить
          </button>
        </div>
      ) : city ? (
        <>
          <div className="page-heading">
            <p className="eyebrow">{city.countryName}</p>
            <h1>{city.nameRu}</h1>
          </div>

          <article className="city-details">
            <h2>О направлении</h2>

            <p>
              {city.description || 'Описание города скоро появится.'}
            </p>

            {city.latitude != null && city.longitude != null && (
              <dl className="city-coordinates">
                <div>
                  <dt>Широта</dt>
                  <dd>{city.latitude}</dd>
                </div>

                <div>
                  <dt>Долгота</dt>
                  <dd>{city.longitude}</dd>
                </div>
              </dl>
            )}
          </article>

          <div className="status-panel city-plans">
            <h2>Планирование путешествия</h2>

            <p>
              На следующих этапах здесь появятся доступные
              отели, мероприятия и добавление города в маршрут.
            </p>
          </div>
        </>
      ) : (
        <p className="status-panel">
          Информация о городе отсутствует.
        </p>
      )}
    </section>
  );
}