import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import db from '../db.js';

import {
  requestOtp,
  verifyOtp
} from '../services/auth.js';

import {
  startSession,
  restoreSession,
  endSession,
  REFRESH_TTL_MS
} from '../services/sessions.js';

const router = Router();

const COOKIE_NAME = 'ctours_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'strict',
  path: '/api/v1/auth'
};

// Пока разрешаем только наш локальный frontend.
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

function checkBrowserOrigin(req, res, next) {
  const origin = req.get('origin');

  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({
      error: {
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'Запрос разрешён только из интерфейса c.tours.'
      }
    });
  }

  return next();
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

function sendError(res, error) {
  return res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message
    }
  });
}

function limitMessage() {
  return {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов. Повторите позднее.'
    }
  };
}

const sendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage()
});

const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage()
});

const sessionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage()
});

// Проверка OTP и создание сессии выполняются согласованно.
const loginTransaction = db.transaction((phone, code) => {
  const result = verifyOtp(phone, code);

  if (result.error) {
    return result;
  }

  return startSession(result.data.user.userId);
});

// Не разрешаем кешировать ответы авторизации.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/otp/send', sendLimiter, (req, res) => {
  const result = requestOtp(req.body?.phone);

  if (result.error) {
    return sendError(res, result.error);
  }

  return res.status(202).json({
    data: result.data
  });
});

router.post(
  '/otp/verify',
  checkBrowserOrigin,
  verifyLimiter,
  (req, res) => {
    const result = loginTransaction.immediate(
      req.body?.phone,
      req.body?.code
    );

    if (result.error) {
      return sendError(res, result.error);
    }

    // Повторный вход в этом браузере отзывает предыдущую
    // refresh-сессию, если cookie ещё присутствует.
    endSession(req.cookies?.[COOKIE_NAME]);

    res.cookie(
      COOKIE_NAME,
      result.refreshToken,
      {
        ...cookieOptions,
        maxAge: REFRESH_TTL_MS
      }
    );

    return res.json({
      data: result.data
    });
  }
);

router.post(
  '/refresh',
  checkBrowserOrigin,
  sessionLimiter,
  (req, res) => {
    const result = restoreSession(
      req.cookies?.[COOKIE_NAME]
    );

    if (!result) {
      clearRefreshCookie(res);

      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Сессия завершена. Войдите повторно.'
        }
      });
    }

    return res.json({
      data: result.data
    });
  }
);

router.post('/logout', checkBrowserOrigin, (req, res) => {
  endSession(req.cookies?.[COOKIE_NAME]);
  clearRefreshCookie(res);

  return res.json({
    data: {
      message: 'Вы вышли из аккаунта.'
    }
  });
});

export default router;