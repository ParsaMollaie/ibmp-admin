import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of roles
 */
export async function getRoles(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.RoleItem>>>(
    `${API_BASE}/roles`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Create a new role
 */
export async function createRole(data: API.RolePayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/roles`, {
    method: 'POST',
    data,
  });
}

/**
 * Update an existing role's name/title
 */
export async function updateRole(id: string, data: API.RolePayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/roles/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Get the permission names currently assigned to a role
 */
export async function getRolePermissions(id: string) {
  return request<API.ApiResponse<string[]>>(
    `${API_BASE}/roles/${id}/permissions`,
    {
      method: 'GET',
    },
  );
}

/**
 * Replace the full set of permissions assigned to a role
 */
export async function updateRolePermissions(id: string, permissions: string[]) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/roles/${id}/permissions`, {
    method: 'PUT',
    data: { permissions },
  });
}
