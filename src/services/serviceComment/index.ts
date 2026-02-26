import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of service comments with optional filters
 */
export async function getServiceComments(params?: {
  search?: string;
  service_type?: string;
  commenter_type?: string;
  is_active?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.ServiceCommentItem>>
  >(`${API_BASE}/service-comments`, {
    method: 'GET',
    params,
  });
}

/**
 * Get a single service comment by ID
 */
export async function getServiceComment(id: string) {
  return request<API.ApiResponse<API.ServiceCommentItem>>(
    `${API_BASE}/service-comments/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update service comment (toggle is_active)
 */
export async function updateServiceComment(
  id: string,
  data: API.ServiceCommentPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/service-comments/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a service comment
 */
export async function deleteServiceComment(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/service-comments/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get service comment statistics
 */
export async function getServiceCommentStats() {
  return request<API.ApiResponse<API.ServiceCommentStats>>(
    `${API_BASE}/service-comments/stats`,
    {
      method: 'GET',
    },
  );
}
