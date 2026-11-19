import { apiRequest } from './client';

export async function getMyProfile(token) {
  const response = await apiRequest('/users/me', {
    token
  });

  return response.data;
}

export async function updateMyProfile({
  token,
  fullName,
  email
}) {
  const response = await apiRequest('/users/me', {
    method: 'PATCH',
    token,
    body: {
      fullName,
      email
    }
  });

  return response.data;
}