import { apiGet } from './client';

export async function getCities({ signal } = {}) {
  const response = await apiGet('/catalog/cities', {
    signal
  });

  if (!Array.isArray(response.data)) {
    throw new Error('Получен некорректный список городов');
  }

  return response.data;
}

export async function getCityById(cityId, { signal } = {}) {
  const response = await apiGet(
    `/catalog/cities/${encodeURIComponent(cityId)}`,
    { signal }
  );

  if (!response.data?.cityId) {
    throw new Error('Получены некорректные данные города');
  }

  return response.data;
}