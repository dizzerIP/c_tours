import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { fileURLToPath } from 'node:url';

import healthRoutes from './routes/health.js';
import citiesRoutes from './routes/cities.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';

dotenv.config({
  path: fileURLToPath(new URL('./.env', import.meta.url))
});

const app = express();

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '127.0.0.1';

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error('PORT должен быть целым числом от 1 до 65535');
}

app.disable('x-powered-by');

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Проверка работы API
app.use('/api/v1/health', healthRoutes);

// Справочник городов
app.use('/api/v1/catalog/cities', citiesRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);

// Ответ для неизвестных маршрутов
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Маршрут не найден'
    }
  });
});

// Обработчик ошибок подключается последним
app.use(errorHandler);

const server = app.listen(port, host, () => {
  console.log(`Сервер запущен: http://${host}:${port}`);
  console.log(
    `Проверка API: http://${host}:${port}/api/v1/health`
  );
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Порт ${port} уже занят. Остановите другой сервер или измените PORT в .env.`
    );
  } else {
    console.error('Ошибка запуска сервера:', error.message);
  }

  process.exitCode = 1;
});