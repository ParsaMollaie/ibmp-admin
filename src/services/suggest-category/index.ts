import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all suggest categories with optional filters
 */
export async function getSuggestCategories(params?: {
  title?: string;
  status?: API.SuggestCategoryStatus;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.SuggestCategoryItem>>
  >(`${API_BASE}/suggest-categories`, {
    method: 'GET',
    params,
  });
}

/**
 * Update an existing suggest category
 */
export async function updateSuggestCategory(
  id: string,
  data: API.SuggestCategoryPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/suggest-categories/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a suggest category
 */
export async function deleteSuggestCategory(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/suggest-categories/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Approve a suggest category
 */
export async function approveSuggestCategory(id: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/suggest-categories/${id}/approve`,
    {
      method: 'PUT',
    },
  );
}

/**
 * Reject a suggest category
 */
export async function rejectSuggestCategory(id: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/suggest-categories/${id}/reject`,
    {
      method: 'PUT',
    },
  );
}
