import { randomUUID } from 'node:crypto';

import db from '../db.js';

const countries = [
  {
    nameRu: 'Россия',
    isoCode: 'RU'
  },
  {
    nameRu: 'Турция',
    isoCode: 'TR'
  },
  {
    nameRu: 'Таиланд',
    isoCode: 'TH'
  },
  {
    nameRu: 'ОАЭ',
    isoCode: 'AE'
  },
  {
    nameRu: 'Грузия',
    isoCode: 'GE'
  },
  {
    nameRu: 'Казахстан',
    isoCode: 'KZ'
  }
];

const countStatement = db.prepare(`
  SELECT COUNT(*) AS total
  FROM countries
`);

const existingCountriesStatement = db.prepare(`
  SELECT
    name_ru,
    iso_code
  FROM countries
`);

const insertCountry = db.prepare(`
  INSERT INTO countries (
    country_id,
    name_ru,
    iso_code,
    is_active
  )
  VALUES (?, ?, ?, 1)
`);

const total = countStatement.get().total;

if (total > 0) {
  const existingCountries = new Set(
    existingCountriesStatement
      .all()
      .map((country) => country.iso_code)
  );

  let added = 0;

  for (const country of countries) {
    if (existingCountries.has(country.isoCode)) {
      continue;
    }

    insertCountry.run(
      randomUUID(),
      country.nameRu,
      country.isoCode
    );

    added += 1;
  }

  if (added === 0) {
    console.log(
      'Все демонстрационные страны уже есть в базе.'
    );
  } else {
    console.log(
      `Добавлено стран: ${added}.`
    );
  }

  process.exit(0);
}

for (const country of countries) {
  insertCountry.run(
    randomUUID(),
    country.nameRu,
    country.isoCode
  );
}

console.log(
  `Добавлено стран: ${countries.length}.`
);