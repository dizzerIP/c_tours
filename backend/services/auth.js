import { createHash, randomInt } from 'node:crypto';

import db from '../db.js';

import {
  saveOtp,
  getLatestOtp,
  countRecentOtp,
  invalidateOutstandingOtp,
  increaseOtpAttempts,
  markOtpConsumed
} from '../models/otp.js';

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_REQUEST_LIMIT = 3;

// Демонстрационный номер для локальной разработки.
const DEMO_PHONE = '+79991234567';

function normalizePhone(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const phone = value.trim();

  if (!/^\+7\d{10}$/.test(phone)) {
    return null;
  }

  return phone;
}

function hashCode(code) {
  return createHash('sha256')
    .update(code)
    .digest('hex');
}

const selectUserByPhone = db.prepare(`
  SELECT
    user_id,
    phone_number,
    full_name,
    email,
    role,
    status
  FROM users
  WHERE phone_number = ?
  LIMIT 1
`);

export function requestOtp(phone) {
  const phoneNumber = normalizePhone(phone);

  if (!phoneNumber) {
    return {
      error: {
        status: 400,
        code: 'INVALID_PHONE',
        message: 'Введите номер в формате +79991234567.'
      }
    };
  }

  const now = Date.now();
  const recentCount = countRecentOtp(
    phoneNumber,
    now - 10 * 60 * 1000
  );

  if (recentCount >= OTP_REQUEST_LIMIT) {
    return {
      error: {
        status: 429,
        code: 'OTP_REQUEST_LIMIT',
        message:
          'Слишком много запросов кода. ' +
          'Повторите попытку позже.'
      }
    };
  }

  const latestOtp = getLatestOtp(phoneNumber);

  if (
    latestOtp &&
    latestOtp.consumedAt === null &&
    latestOtp.expiresAt > now &&
    latestOtp.createdAt + OTP_RESEND_MS > now
  ) {
    const secondsLeft = Math.ceil(
      (latestOtp.createdAt + OTP_RESEND_MS - now) / 1000
    );

    return {
      error: {
        status: 429,
        code: 'OTP_RESEND_LIMIT',
        message:
          `Новый код можно запросить через ${secondsLeft} сек.`
      }
    };
  }

  invalidateOutstandingOtp(phoneNumber, now);

  const code = String(randomInt(100000, 1000000));

  saveOtp({
    phoneNumber,
    codeHash: hashCode(code),
    createdAt: now,
    expiresAt: now + OTP_TTL_MS
  });

  // Локальный тестовый режим: настоящий SMS-провайдер
  // пока не подключён.
  console.log(
    `[DEV OTP] ${phoneNumber}: код ${code} ` +
    `(действует 2 минуты)`
  );

  return {
    data: {
      message: 'Код подтверждения создан.',
      resendAfterSeconds: Math.ceil(OTP_RESEND_MS / 1000),
      expiresInSeconds: Math.ceil(OTP_TTL_MS / 1000)
    }
  };
}

export function verifyOtp(phone, code) {
  const phoneNumber = normalizePhone(phone);

  if (!phoneNumber) {
    return {
      error: {
        status: 400,
        code: 'INVALID_PHONE',
        message: 'Введите номер в формате +79991234567.'
      }
    };
  }

  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return {
      error: {
        status: 400,
        code: 'INVALID_OTP_CODE',
        message: 'Введите 6 цифр кода.'
      }
    };
  }

  const now = Date.now();
  const otp = getLatestOtp(phoneNumber);

  if (
    !otp ||
    otp.consumedAt !== null ||
    otp.expiresAt <= now
  ) {
    return {
      error: {
        status: 401,
        code: 'OTP_INVALID_OR_EXPIRED',
        message:
          'Код недействителен или истёк. Запросите новый.'
      }
    };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    markOtpConsumed(otp.otpId, now);

    return {
      error: {
        status: 429,
        code: 'OTP_ATTEMPTS_EXCEEDED',
        message: 'Слишком много попыток. Запросите новый код.'
      }
    };
  }

  if (otp.codeHash !== hashCode(code)) {
    increaseOtpAttempts(otp.otpId);

    return {
      error: {
        status: 401,
        code: 'OTP_INVALID',
        message: 'Неверный код подтверждения.'
      }
    };
  }

  const user = selectUserByPhone.get(phoneNumber);

  if (!user) {
    markOtpConsumed(otp.otpId, now);

    return {
      error: {
        status: 404,
        code: 'USER_NOT_FOUND',
        message:
          'Пользователь с таким номером не найден. ' +
          'Используйте демонстрационный номер.'
      }
    };
  }

  if (user.status !== 'active') {
    markOtpConsumed(otp.otpId, now);

    return {
      error: {
        status: 403,
        code: 'USER_INACTIVE',
        message: 'Аккаунт недоступен.'
      }
    };
  }

  markOtpConsumed(otp.otpId, now);

  return {
    data: {
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    }
  };
}

export { normalizePhone, DEMO_PHONE };