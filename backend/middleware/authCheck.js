import jwt from 'jsonwebtoken';

import { getUserById } from '../models/users.js';

export default function authCheck(req, res, next) {
  const authorization = req.get('authorization');

  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Необходима авторизация.'
      }
    });
  }

  let payload;

  try {
    payload = jwt.verify(
      match[1],
      process.env.JWT_ACCESS_SECRET,
      {
        algorithms: ['HS256'],
        issuer: 'c.tours-api',
        audience: 'c.tours-client'
      }
    );
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Токен недействителен или срок его действия истёк.'
      }
    });
  }

  if (
    typeof payload !== 'object' ||
    typeof payload.sub !== 'string'
  ) {
    return res.status(401).json({
      error: {
        code: 'INVALID_ACCESS_TOKEN',
        message: 'Некорректный токен доступа.'
      }
    });
  }

  const user = getUserById(payload.sub);

  if (!user || user.status !== 'active') {
    return res.status(401).json({
      error: {
        code: 'ACCOUNT_UNAVAILABLE',
        message: 'Аккаунт недоступен.'
      }
    });
  }

  req.user = user;

  return next();
}