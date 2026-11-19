import { Router } from 'express';

import authCheck from '../middleware/authCheck.js';

import { saveUserProfile } from '../models/users.js';

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ');
}

router.get('/me', authCheck, (req, res) => {
  res.json({
    data: {
      userId: req.user.userId,
      phoneNumber: req.user.phoneNumber,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

router.patch('/me', authCheck, (req, res) => {
  const body = req.body ?? {};

  // Принимаем только разрешённые поля.
  // role, userId, status и другие поля игнорируются.
  const fullName = normalizeText(body.fullName);
  const email = normalizeText(body.email);

  if (fullName.length > 100) {
    return res.status(400).json({
      error: {
        code: 'INVALID_FULL_NAME',
        message: 'Имя не должно превышать 100 символов.'
      }
    });
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_EMAIL',
        message: 'Введите корректный адрес электронной почты.'
      }
    });
  }

  if (email.length > 254) {
    return res.status(400).json({
      error: {
        code: 'INVALID_EMAIL',
        message: 'Адрес электронной почты слишком длинный.'
      }
    });
  }

  const updatedUser = saveUserProfile({
    userId: req.user.userId,
    fullName: fullName || null,
    email: email || null
  });

  if (!updatedUser) {
    return res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Пользователь не найден.'
      }
    });
  }

  return res.json({
    data: {
      userId: updatedUser.userId,
      phoneNumber: updatedUser.phoneNumber,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    }
  });
});

export default router;