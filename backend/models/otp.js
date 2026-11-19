import { randomUUID } from 'node:crypto';

import db from '../db.js';

const insertOtp = db.prepare(`
  INSERT INTO phone_otp (
    otp_id,
    phone_number,
    code_hash,
    created_at,
    expires_at
  )
  VALUES (
    @otpId,
    @phoneNumber,
    @codeHash,
    @createdAt,
    @expiresAt
  )
`);

const selectLatestOtp = db.prepare(`
  SELECT
    otp_id AS otpId,
    phone_number AS phoneNumber,
    code_hash AS codeHash,
    attempts,
    created_at AS createdAt,
    expires_at AS expiresAt,
    consumed_at AS consumedAt
  FROM phone_otp
  WHERE phone_number = ?
  ORDER BY created_at DESC, rowid DESC
  LIMIT 1
`);

const selectRecentCount = db.prepare(`
  SELECT COUNT(*) AS total
  FROM phone_otp
  WHERE
    phone_number = ?
    AND created_at >= ?
`);

const consumeOutstanding = db.prepare(`
  UPDATE phone_otp
  SET consumed_at = ?
  WHERE
    phone_number = ?
    AND consumed_at IS NULL
`);

const incrementAttempts = db.prepare(`
  UPDATE phone_otp
  SET attempts = attempts + 1
  WHERE
    otp_id = ?
    AND consumed_at IS NULL
    AND attempts < 5
`);

const consumeOtp = db.prepare(`
  UPDATE phone_otp
  SET consumed_at = ?
  WHERE
    otp_id = ?
    AND consumed_at IS NULL
`);

export function saveOtp({
  phoneNumber,
  codeHash,
  createdAt,
  expiresAt
}) {
  const otpId = randomUUID();

  insertOtp.run({
    otpId,
    phoneNumber,
    codeHash,
    createdAt,
    expiresAt
  });

  return otpId;
}

export function getLatestOtp(phoneNumber) {
  return selectLatestOtp.get(phoneNumber);
}

export function countRecentOtp(phoneNumber, since) {
  return selectRecentCount.get(phoneNumber, since).total;
}

export function invalidateOutstandingOtp(phoneNumber, now) {
  return consumeOutstanding.run(now, phoneNumber).changes;
}

export function increaseOtpAttempts(otpId) {
  return incrementAttempts.run(otpId).changes;
}

export function markOtpConsumed(otpId, now) {
  return consumeOtp.run(now, otpId).changes;
}