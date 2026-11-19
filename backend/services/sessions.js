import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

import db from '../db.js';

import { getUserById } from '../models/users.js';

import {
  saveRefreshToken,
  getRefreshTokenByHash,
  revokeRefreshToken
} from '../models/tokens.js';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ACCESS_TTL_SECONDS = 15 * 60;

function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

function validTokenFormat(token) {
  return typeof token === 'string' &&
    /^[a-f0-9]{96}$/.test(token);
}

function createAccessData(user) {
  const accessToken = jwt.sign(
    {},
    process.env.JWT_ACCESS_SECRET,
    {
      algorithm: 'HS256',
      subject: user.userId,
      issuer: 'c.tours-api',
      audience: 'c.tours-client',
      expiresIn: ACCESS_TTL_SECONDS
    }
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresInSeconds: ACCESS_TTL_SECONDS,

    user: {
      userId: user.userId,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  };
}

export function startSession(userId) {
  const user = getUserById(userId);

  if (!user || user.status !== 'active') {
    throw new Error('Нельзя создать сессию для недоступного аккаунта');
  }

  const refreshToken = randomBytes(48).toString('hex');
  const now = Date.now();

  saveRefreshToken({
    userId,
    tokenHash: hashToken(refreshToken),
    createdAt: now,
    expiresAt: now + REFRESH_TTL_MS
  });

  return {
    refreshToken,
    data: createAccessData(user)
  };
}

const restoreSessionTransaction = db.transaction((refreshToken) => {
  if (!validTokenFormat(refreshToken)) {
    return null;
  }

  const savedToken = getRefreshTokenByHash(
    hashToken(refreshToken)
  );

  const now = Date.now();

  if (
    !savedToken ||
    savedToken.revokedAt !== null ||
    savedToken.expiresAt <= now
  ) {
    return null;
  }

  const user = getUserById(savedToken.userId);

  if (!user || user.status !== 'active') {
    revokeRefreshToken({
      tokenId: savedToken.tokenId,
      now
    });

    return null;
  }

  return {
    data: createAccessData(user)
  };
});

export function restoreSession(refreshToken) {
  return restoreSessionTransaction.immediate(refreshToken);
}

export function endSession(refreshToken) {
  if (!validTokenFormat(refreshToken)) {
    return;
  }

  const savedToken = getRefreshTokenByHash(
    hashToken(refreshToken)
  );

  if (!savedToken) {
    return;
  }

  revokeRefreshToken({
    tokenId: savedToken.tokenId,
    now: Date.now()
  });
}