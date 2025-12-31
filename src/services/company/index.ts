import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// ============================================
// COMPANY API FUNCTIONS
// ============================================

/**
 * Get all companies with optional filter params
 * Used by ProTable to fetch paginated company list
 *
 * @param params.name - Filter by company name (partial match)
 * @param params.tag - Filter by tag ('regular' | 'most-view' | 'promoted')
 * @param params.page - Page number for pagination
 * @param params.page_size - Number of items per page
 */
export async function getCompanies(params?: {
  page?: number;
  page_size?: number;
  tag?: API.CompanyTag;
  name?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.CompanyItem>>>(
    `${API_BASE}/companies`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Get a single company by ID
 * Used when editing a company to get fresh/complete data
 * The detail endpoint may return more fields than the list endpoint
 *
 * @param id - Company UUID
 */
export async function getCompany(id: string) {
  return request<API.ApiResponse<API.CompanyItem>>(
    `${API_BASE}/companies/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update an existing company
 *
 * @param id - Company UUID to update
 * @param data - Updated company payload
 *
 * Important notes:
 * - Use 'social_medias' (with 's') in payload, not 'social_media'
 * - logo/catalog should be base64 for new uploads, null to remove, or existing URL to keep
 */
export async function updateCompany(id: string, data: API.CompanyPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/companies/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Update company tag (regular, most-view, or promoted)
 * The tag is part of the URL path, not the body
 *
 * @param id - Company UUID
 * @param tag - New tag value
 */
export async function updateCompanyTag(id: string, tag: API.CompanyTag) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/companies/${id}/${tag}`, {
    method: 'PUT',
    data: {}, // API expects a body even though it's not used
  });
}

// ============================================
// PROVINCE & CITY API FUNCTIONS
// These are used for the location dropdowns in company forms
// ============================================

/**
 * Get all provinces for dropdown selection
 * Returns a list of all provinces in the system
 *
 * Endpoint: GET /api/v1/admin/provinces
 */
export async function getProvinces() {
  return request<API.ApiResponse<API.PaginatedResponse<API.ProvinceItem>>>(
    `${API_BASE}/provinces`,
    {
      method: 'GET',
      params: {
        page_size: 100000, // Get all provinces at once
      },
    },
  );
}

/**
 * Get cities for a specific province
 * Used to populate the city dropdown after a province is selected
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
        page_size: 100000, // Get all cities for the province
      },
    },
  );
}
