import { Router } from 'express';

import authCheck from '../middleware/authCheck.js';

import {
  getCities,
  getCityById,
  getCountries,
  getAdminCities,
  getAdminCityById,
  createCity,
  saveCity
} from '../models/cities.js';

const router = Router();

const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Доступ разрешён только администратору.'
      }
    });
  }

  return next();
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ');
}

function normalizeDescription(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function validateCityPayload(body) {
  const nameRu = normalizeText(body.nameRu);
  const description = normalizeDescription(body.description);
  const countryId = normalizeText(body.countryId);

  const latitude = parseCoordinate(body.latitude);
  const longitude = parseCoordinate(body.longitude);

  if (!nameRu) {
    return {
      error: {
        status: 400,
        code: 'INVALID_CITY_NAME',
        message: 'Введите название города.'
      }
    };
  }

  if (nameRu.length > NAME_MAX_LENGTH) {
    return {
      error: {
        status: 400,
        code: 'INVALID_CITY_NAME',
        message:
          `Название города не должно превышать ` +
          `${NAME_MAX_LENGTH} символов.`
      }
    };
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return {
      error: {
        status: 400,
        code: 'INVALID_DESCRIPTION',
        message:
          `Описание не должно превышать ` +
          `${DESCRIPTION_MAX_LENGTH} символов.`
      }
    };
  }

  if (!countryId) {
    return {
      error: {
        status: 400,
        code: 'INVALID_COUNTRY',
        message: 'Выберите страну.'
      }
    };
  }

  if (
    latitude !== null &&
    (latitude < -90 || latitude > 90)
  ) {
    return {
      error: {
        status: 400,
        code: 'INVALID_LATITUDE',
        message: 'Широта должна быть от -90 до 90.'
      }
    };
  }

  if (
    longitude !== null &&
    (longitude < -180 || longitude > 180)
  ) {
    return {
      error: {
        status: 400,
        code: 'INVALID_LONGITUDE',
        message: 'Долгота должна быть от -180 до 180.'
      }
    };
  }

  return {
    data: {
      nameRu,
      description: description || null,
      countryId,
      latitude,
      longitude
    }
  };
}

router.get(
  '/admin',
  authCheck,
  requireAdmin,
  (_req, res) => {
    return res.json({
      data: {
        cities: getAdminCities(),
        countries: getCountries()
      }
    });
  }
);

router.post(
  '/admin',
  authCheck,
  requireAdmin,
  (req, res) => {
    const result = validateCityPayload(req.body ?? {});

    if (result.error) {
      return res.status(result.error.status).json({
        error: {
          code: result.error.code,
          message: result.error.message
        }
      });
    }

    try {
      const city = createCity({
        countryId: result.data.countryId,
        nameRu: result.data.nameRu,
        description: result.data.description,
        latitude: result.data.latitude,
        longitude: result.data.longitude
      });

      return res.status(201).json({
        data: city
      });
    } catch (error) {
      console.error('Не удалось создать город:', error);

      return res.status(500).json({
        error: {
          code: 'CITY_CREATION_FAILED',
          message: 'Не удалось создать город.'
        }
      });
    }
  }
);

router.patch(
  '/admin/:id',
  authCheck,
  requireAdmin,
  (req, res) => {
    const cityId = req.params.id;
    const existingCity = getAdminCityById(cityId);

    if (!existingCity) {
      return res.status(404).json({
        error: {
          code: 'CITY_NOT_FOUND',
          message: 'Город не найден.'
        }
      });
    }

    const result = validateCityPayload(req.body ?? {});

    if (result.error) {
      return res.status(result.error.status).json({
        error: {
          code: result.error.code,
          message: result.error.message
        }
      });
    }

    const isActive = req.body?.isActive === false ? 0 : 1;

    try {
      const city = saveCity({
        cityId,
        countryId: result.data.countryId,
        nameRu: result.data.nameRu,
        description: result.data.description,
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        isActive
      });

      return res.json({
        data: city
      });
    } catch (error) {
      console.error('Не удалось обновить город:', error);

      return res.status(500).json({
        error: {
          code: 'CITY_UPDATE_FAILED',
          message: 'Не удалось обновить город.'
        }
      });
    }
  }
);

router.get('/', (_req, res) => {
  res.json({
    data: getCities()
  });
});

router.get('/:id', (req, res) => {
  const city = getCityById(req.params.id);

  if (!city) {
    return res.status(404).json({
      error: {
        code: 'CITY_NOT_FOUND',
        message: 'Город не найден'
      }
    });
  }

  return res.json({
    data: city
  });
});

export default router;