import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get website contact information (single record, not a list)
export async function getWebsiteContact() {
  return request<API.ApiResponse<API.WebsiteContactItem>>(
    `${API_BASE}/website-contact`,
    {
      method: 'GET',
    },
  );
}

// Create or update website contact information
export async function saveWebsiteContact(data: API.WebsiteContactPayload) {
  return request<API.ApiResponse<API.WebsiteContactItem>>(
    `${API_BASE}/website-contact`,
    {
      method: 'POST',
      data,
    },
  );
}
