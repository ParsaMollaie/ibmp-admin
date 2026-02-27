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
 * Get cities for a specific province
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
