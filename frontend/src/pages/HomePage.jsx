import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="hero">
      <p className="eyebrow">Ваш маршрут начинается здесь</p>

      <h1>Путешествие, собранное под вас</h1>

      <p className="hero-description">
        Выбирайте города, добавляйте мероприятия и формируйте
        собственный маршрут. Начните со знакомства с доступными
        направлениями.
      </p>

      <Link className="button" to="/cities">
        Посмотреть города
      </Link>
    </section>
  );
}