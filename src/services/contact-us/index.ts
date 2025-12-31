import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all contact us submissions with optional filter params
export async function getContactUs(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.ContactUsItem>>>(
    `${API_BASE}/contact-us`,
    {
      method: 'GET',
      params,
    },
  );
}

// Update contact us status
export async function updateContactUsStatus(
  id: string,
  data: API.ContactUsPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/contact-us/${id}`, {
    method: 'PUT',
    data,
  });
}
