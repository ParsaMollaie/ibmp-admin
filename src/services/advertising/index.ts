import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all advertisings with optional search/filter params
export async function getAdvertisings(params?: {
  title?: string;
  section?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  // Debug log - remove this after confirming it works
  console.log('🔍 getAdvertisings called with params:', params);

  return request<API.ApiResponse<API.PaginatedResponse<API.AdvertisingItem>>>(
    `${API_BASE}/advertising`,
    {
      method: 'GET',
      params,
    },
  );
}

// Get a single advertising by ID
export async function getAdvertising(id: string) {
  return request<API.ApiResponse<API.AdvertisingItem>>(
    `${API_BASE}/advertising/${id}`,
    {
      method: 'GET',
    },
  );
}

// Create a new advertising
export async function createAdvertising(data: API.AdvertisingPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/advertising`, {
    method: 'POST',
    data,
  });
}

// Update an existing advertising
export async function updateAdvertising(
  id: string,
  data: API.AdvertisingPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/advertising/${id}`, {
    method: 'PUT',
    data,
  });
}
