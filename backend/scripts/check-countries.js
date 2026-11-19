import db from '../db.js';

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  ORDER BY name
`).all();

console.log('Таблицы в базе:');
console.log(
  tables.map((table) => table.name).join(', ')
);

const countriesTable = tables.find(
  (table) => table.name === 'countries'
);

if (!countriesTable) {
  console.log(
    'Таблица countries не найдена.'
  );

  process.exit(0);
}

const columns = db.prepare(`
  PRAGMA table_info(countries)
`).all();

console.log('\nКолонки таблицы countries:');
console.log(
  columns
    .map(
      (column) =>
        `${column.name} (${column.type || 'без типа'})`
    )
    .join(', ')
);

const countries = db.prepare(`
  SELECT *
  FROM countries
  ORDER BY rowid DESC
  LIMIT 20
`).all();

console.log(
  `\nНайдено стран: ${countries.length}.`
);

if (countries.length > 0) {
  console.log('\nПоследние записи:');
  console.log(countries);
}