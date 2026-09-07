import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of permissions (read-only — seeded from the backend route catalog)
 */
export async function getPermissions(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.PermissionItem>>>(
    `${API_BASE}/permissions`,
    {
      method: 'GET',
      params,
    },
  );
}
