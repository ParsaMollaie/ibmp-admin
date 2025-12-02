import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all business partners with optional search/filter params
export async function getBusinessPartners(params?: {
  title?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.BusinessPartnerItem>>
  >(`${API_BASE}/business-partners`, {
    method: 'GET',
    params,
  });
}

// Get a single business partner by ID
export async function getBusinessPartner(id: string) {
  return request<API.ApiResponse<API.BusinessPartnerItem>>(
    `${API_BASE}/business-partners/${id}`,
    {
      method: 'GET',
    },
  );
}

// Create a new business partner
export async function createBusinessPartner(data: API.BusinessPartnerPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/business-partners`, {
    method: 'POST',
    data,
  });
}

// Update an existing business partner
export async function updateBusinessPartner(
  id: string,
  data: API.BusinessPartnerPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/business-partners/${id}`, {
    method: 'PUT',
    data,
  });
}
