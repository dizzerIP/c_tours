import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="hero">
      <p className="eyebrow">Ошибка 404</p>

      <h1>Страница не найдена</h1>

      <p className="hero-description">
        Возможно, адрес указан неверно или страница ещё не создана.
      </p>

      <Link className="button" to="/">
        На главную
      </Link>
    </section>
  );
}