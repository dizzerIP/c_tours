import { apiRequest } from './client';

export async function sendOtp(phone) {
  const response = await apiRequest('/auth/otp/send', {
    method: 'POST',
    body: { phone }
  });

  return response.data;
}

export async function verifyOtp(phone, code) {
  const response = await apiRequest('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code }
  });

  return response.data;
}

export async function getMyProfile(token) {
  const response = await apiRequest('/users/me', {
    token
  });

  return response.data;
}

// Объединяем одновременные запросы восстановления
// в пределах одной вкладки.
let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = apiRequest('/auth/refresh', {
      method: 'POST',
      body: {}
    })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function logoutSession() {
  await apiRequest('/auth/logout', {
    method: 'POST',
    body: {}
  });
}