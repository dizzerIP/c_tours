import { randomUUID } from 'node:crypto';

import db from '../db.js';

const selectCities = db.prepare(`
  SELECT
    c.city_id AS cityId,
    c.name_ru AS nameRu,
    c.description,
    co.country_id AS countryId,
    co.name_ru AS countryName
  FROM cities AS c
  JOIN countries AS co
    ON co.country_id = c.country_id
  WHERE
    c.is_active = 1
    AND co.is_active = 1
  ORDER BY c.name_ru
`);

const selectCityById = db.prepare(`
  SELECT
    c.city_id AS cityId,
    c.name_ru AS nameRu,
    c.description,
    c.latitude,
    c.longitude,
    co.country_id AS countryId,
    co.name_ru AS countryName
  FROM cities AS c
  JOIN countries AS co
    ON co.country_id = c.country_id
  WHERE
    c.city_id = ?
    AND c.is_active = 1
    AND co.is_active = 1
`);

const selectCountries = db.prepare(`
  SELECT
    country_id AS countryId,
    name_ru AS nameRu
  FROM countries
  WHERE is_active = 1
  ORDER BY name_ru
`);

const selectAdminCities = db.prepare(`
  SELECT
    c.city_id AS cityId,
    c.name_ru AS nameRu,
    c.description,
    c.latitude,
    c.longitude,
    c.is_active AS isActive,
    co.country_id AS countryId,
    co.name_ru AS countryName
  FROM cities AS c
  JOIN countries AS co
    ON co.country_id = c.country_id
  ORDER BY c.name_ru
`);

const selectAdminCityById = db.prepare(`
  SELECT
    c.city_id AS cityId,
    c.name_ru AS nameRu,
    c.description,
    c.latitude,
    c.longitude,
    c.is_active AS isActive,
    co.country_id AS countryId,
    co.name_ru AS countryName
  FROM cities AS c
  JOIN countries AS co
    ON co.country_id = c.country_id
  WHERE c.city_id = ?
`);

const insertCity = db.prepare(`
  INSERT INTO cities (
    city_id,
    country_id,
    name_ru,
    description,
    latitude,
    longitude,
    is_active
  )
  VALUES (
    @cityId,
    @countryId,
    @nameRu,
    @description,
    @latitude,
    @longitude,
    @isActive
  )
`);

const updateCity = db.prepare(`
  UPDATE cities
  SET
    country_id = @countryId,
    name_ru = @nameRu,
    description = @description,
    latitude = @latitude,
    longitude = @longitude,
    is_active = @isActive
  WHERE city_id = @cityId
`);

export function getCities() {
  return selectCities.all();
}

export function getCityById(cityId) {
  return selectCityById.get(cityId);
}

export function getCountries() {
  return selectCountries.all();
}

export function getAdminCities() {
  return selectAdminCities.all();
}

export function getAdminCityById(cityId) {
  return selectAdminCityById.get(cityId);
}

export function createCity({
  countryId,
  nameRu,
  description,
  latitude,
  longitude
}) {
  const cityId = randomUUID();

  insertCity.run({
    cityId,
    countryId,
    nameRu,
    description,
    latitude,
    longitude,
    isActive: 1
  });

  return getAdminCityById(cityId);
}

export function saveCity({
  cityId,
  countryId,
  nameRu,
  description,
  latitude,
  longitude,
  isActive
}) {
  updateCity.run({
    cityId,
    countryId,
    nameRu,
    description,
    latitude,
    longitude,
    isActive
  });

  return getAdminCityById(cityId);
}