import { apiRequest } from './client';

export async function getAdminCities(token) {
  const response = await apiRequest('/catalog/cities/admin', {
    token
  });

  return response.data;
}

export async function createCity({
  token,
  nameRu,
  description,
  countryId,
  latitude,
  longitude
}) {
  const response = await apiRequest('/catalog/cities/admin', {
    method: 'POST',
    token,
    body: {
      nameRu,
      description,
      countryId,
      latitude,
      longitude
    }
  });

  return response.data;
}

export async function updateCity({
  token,
  cityId,
  nameRu,
  description,
  countryId,
  latitude,
  longitude,
  isActive
}) {
  const response = await apiRequest(
    `/catalog/cities/admin/${cityId}`,
    {
      method: 'PATCH',
      token,
      body: {
        nameRu,
        description,
        countryId,
        latitude,
        longitude,
        isActive
      }
    }
  );

  return response.data;
}