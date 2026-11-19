const API_PREFIX = '/api/v1';

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    token,
    signal
  } = {}
) {
  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers,
    signal,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
      `Ошибка запроса: HTTP ${response.status}`
    );

    error.status = response.status;
    error.code = payload?.error?.code;

    throw error;
  }

  if (payload === null) {
    throw new Error('Сервер вернул некорректный ответ');
  }

  return payload;
}

// Сохраняем совместимость с запросами городов.
export function apiGet(path, options = {}) {
  return apiRequest(path, {
    ...options,
    method: 'GET'
  });
}