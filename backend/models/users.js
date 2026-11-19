import { randomUUID } from 'node:crypto';

import db from '../db.js';

const selectById = db.prepare(`
  SELECT
    user_id AS userId,
    phone_number AS phoneNumber,
    full_name AS fullName,
    email,
    role,
    status,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM users
  WHERE user_id = ?
`);

const selectByPhone = db.prepare(`
  SELECT
    user_id AS userId,
    phone_number AS phoneNumber,
    full_name AS fullName,
    email,
    role,
    status,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM users
  WHERE phone_number = ?
`);

const insertUser = db.prepare(`
  INSERT INTO users (
    user_id,
    phone_number
  )
  VALUES (?, ?)
  ON CONFLICT(phone_number) DO NOTHING
`);

const updateUserProfile = db.prepare(`
  UPDATE users
  SET
    full_name = @fullName,
    email = @email,
    updated_at = @updatedAt
  WHERE user_id = @userId
`);

export function getUserById(userId) {
  return selectById.get(userId);
}

export function getUserByPhone(phoneNumber) {
  return selectByPhone.get(phoneNumber);
}

export function createUserIfMissing(phoneNumber) {
  insertUser.run(randomUUID(), phoneNumber);

  return getUserByPhone(phoneNumber);
}

export function saveUserProfile({
  userId,
  fullName,
  email
}) {
  updateUserProfile.run({
    userId,
    fullName,
    email,
    updatedAt: Date.now()
  });

  return getUserById(userId);
}