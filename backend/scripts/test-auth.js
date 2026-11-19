import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const API_URL = 'http://127.0.0.1:4000/api/v1';

const terminal = createInterface({
  input: stdin,
  output: stdout
});

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload.error?.message || `HTTP ${response.status}`
    );
  }

  return payload;
}

try {
  const phone = (
    await terminal.question(
      'Введите тестовый номер в формате +79991234567: '
    )
  ).trim();

  const sendResult = await request('/auth/otp/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  });

  console.log(sendResult.data.message);
  console.log('Посмотрите код в терминале работающего backend.');

  const code = (
    await terminal.question('Введите код из терминала backend: ')
  ).trim();

  const loginResult = await request('/auth/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, code })
  });

  console.log('Вход выполнен. Токен получен, но не выводится.');

  const profileResult = await request('/users/me', {
    headers: {
      Authorization: `Bearer ${loginResult.data.accessToken}`
    }
  });

  console.log('Профиль пользователя:');
  console.log(profileResult.data);
} catch (error) {
  console.error('Ошибка проверки:', error.message);
  process.exitCode = 1;
} finally {
  terminal.close();
}