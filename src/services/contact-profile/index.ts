import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all contact profiles with optional filters
 * Works with ProTable's request function
 */
export async function getContactProfiles(params?: {
  user_id?: string;
  search?: string;
  current?: number;
  pageSize?: number;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.ContactProfileItem>>
  >(`${API_BASE}/contact-profiles`, {
    method: 'GET',
    params: {
      user_id: params?.user_id,
      search: params?.search,
      page: params?.page || params?.current,
      page_size: params?.page_size || params?.pageSize,
      sorter: params?.sorter,
    },
  });
}

/**
 * Get a single contact profile by ID
 */
export async function getContactProfile(id: string) {
  return request<API.ApiResponse<API.ContactProfileItem>>(
    `${API_BASE}/contact-profiles/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new contact profile
 */
export async function createContactProfile(data: API.ContactProfilePayload) {
  return request<API.ApiResponse<API.ContactProfileItem>>(
    `${API_BASE}/contact-profiles`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Update an existing contact profile
 */
export async function updateContactProfile(
  id: string,
  data: API.ContactProfilePayload,
) {
  return request<API.ApiResponse<API.ContactProfileItem>>(
    `${API_BASE}/contact-profiles/${id}`,
    {
      method: 'PUT',
      data,
    },
  );
}

/**
 * Delete a contact profile
 */
export async function deleteContactProfile(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/contact-profiles/${id}`, {
    method: 'DELETE',
  });
}
