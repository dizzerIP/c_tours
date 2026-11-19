import db from '../db.js';

import { getUserByPhone } from '../models/users.js';

const DEMO_PHONE = '+79991234567';

const user = getUserByPhone(DEMO_PHONE);

if (!user) {
  console.error(
    `Пользователь с номером ${DEMO_PHONE} не найден. ` +
    'Сначала войдите на сайте этим номером.'
  );

  process.exit(1);
}

if (user.role === 'admin') {
  console.log(
    `Пользователь ${DEMO_PHONE} уже администратор.`
  );

  process.exit(0);
}

const result = db.prepare(`
  UPDATE users
  SET
    role = 'admin',
    updated_at = ?
  WHERE user_id = ?
`).run(Date.now(), user.userId);

if (result.changes !== 1) {
  console.error(
    'Не удалось назначить роль администратора.'
  );

  process.exit(1);
}

console.log(
  `Готово. Пользователь ${DEMO_PHONE} ` +
  'теперь администратор.'
);