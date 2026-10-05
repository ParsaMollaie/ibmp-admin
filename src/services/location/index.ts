import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all provinces for dropdown selection
 *
 * Endpoint: GET /api/v1/admin/provinces
 */
export async function getProvinces() {
  return request<API.ApiResponse<API.PaginatedResponse<API.ProvinceItem>>>(
    `${API_BASE}/provinces`,
    {
      method: 'GET',
      params: {
        page_size: 100000,
      },
    },
  );
}

/**
 * Get a single province by ID
 *
 * Endpoint: GET /api/v1/admin/provinces/{provinceId}
 */
export async function getProvince(provinceId: string) {
  return request<API.ApiResponse<API.ProvinceItem>>(
    `${API_BASE}/provinces/${provinceId}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new province
 *
 * Endpoint: POST /api/v1/admin/provinces
 */
export async function createProvince(data: API.ProvincePayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/provinces`, {
    method: 'POST',
    data,
  });
}

/**
 * Update an existing province
 *
 * Endpoint: PUT /api/v1/admin/provinces/{provinceId}
 */
export async function updateProvince(
  provinceId: string,
  data: API.ProvincePayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/provinces/${provinceId}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a province
 *
 * Endpoint: DELETE /api/v1/admin/provinces/{provinceId}
 */
export async function deleteProvince(provinceId: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/provinces/${provinceId}`, {
    method: 'DELETE',
  });
}

/**
 * Get cities for a specific province (used for cascading dropdowns elsewhere)
 *
 * Endpoint: GET /api/v1/admin/provinces/{provinceId}/cities
 *
 * @param provinceId - Province UUID to get cities for
 */
export async function getCities(provinceId: string) {
  return request<API.ApiResponse<API.PaginatedResponse<API.CityItem>>>(
    `${API_BASE}/provinces/${provinceId}/cities`,
    {
      method: 'GET',
      params: {
        page_size: 100000,
      },
    },
  );
}

/**
 * Get a paginated, filterable list of ALL cities (unscoped), for the City management page
 *
 * Endpoint: GET /api/v1/admin/cities
 */
export async function getAllCities(params?: {
  name?: string;
  province_id?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.CityItem>>>(
    `${API_BASE}/cities`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Get a single city by ID
 *
 * Endpoint: GET /api/v1/admin/cities/{cityId}
 */
export async function getCity(cityId: string) {
  return request<API.ApiResponse<API.CityItem>>(
    `${API_BASE}/cities/${cityId}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new city
 *
 * Endpoint: POST /api/v1/admin/cities
 */
export async function createCity(data: API.CityPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/cities`, {
    method: 'POST',
    data,
  });
}

/**
 * Update an existing city (name, province, and/or coordinates)
 *
 * Endpoint: PUT /api/v1/admin/cities/{cityId}
 */
export async function updateCity(cityId: string, data: API.CityPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/cities/${cityId}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a city
 *
 * Endpoint: DELETE /api/v1/admin/cities/{cityId}
 */
export async function deleteCity(cityId: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/cities/${cityId}`, {
    method: 'DELETE',
  });
}
