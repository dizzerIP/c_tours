import { randomUUID } from 'node:crypto';

import db from '../db.js';

const insertToken = db.prepare(`
  INSERT INTO refresh_tokens (
    token_id,
    user_id,
    token_hash,
    created_at,
    expires_at
  )
  VALUES (
    @tokenId,
    @userId,
    @tokenHash,
    @createdAt,
    @expiresAt
  )
`);

const selectByHash = db.prepare(`
  SELECT
    token_id AS tokenId,
    user_id AS userId,
    token_hash AS tokenHash,
    created_at AS createdAt,
    expires_at AS expiresAt,
    revoked_at AS revokedAt,
    replaced_by_token_id AS replacedByTokenId
  FROM refresh_tokens
  WHERE token_hash = ?
`);

const revokeToken = db.prepare(`
  UPDATE refresh_tokens
  SET
    revoked_at = @now,
    replaced_by_token_id = @replacedByTokenId
  WHERE
    token_id = @tokenId
    AND revoked_at IS NULL
`);

const revokeUserTokens = db.prepare(`
  UPDATE refresh_tokens
  SET revoked_at = ?
  WHERE
    user_id = ?
    AND revoked_at IS NULL
`);

export function saveRefreshToken({
  userId,
  tokenHash,
  createdAt,
  expiresAt
}) {
  const tokenId = randomUUID();

  insertToken.run({
    tokenId,
    userId,
    tokenHash,
    createdAt,
    expiresAt
  });

  return tokenId;
}

export function getRefreshTokenByHash(tokenHash) {
  return selectByHash.get(tokenHash);
}

export function revokeRefreshToken({
  tokenId,
  now,
  replacedByTokenId = null
}) {
  return revokeToken.run({
    tokenId,
    now,
    replacedByTokenId
  }).changes;
}

export function revokeAllUserTokens(userId, now) {
  return revokeUserTokens.run(now, userId).changes;
}