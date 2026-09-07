import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of price inquiries with optional filters
 */
export async function getPriceInquiries(params?: {
  status?: API.LeadRequestStatus;
  search?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.PriceInquiryItem>>>(
    `${API_BASE}/price-inquiries`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Get a single price inquiry by ID
 */
export async function getPriceInquiry(id: string) {
  return request<API.ApiResponse<API.PriceInquiryItem>>(
    `${API_BASE}/price-inquiries/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update price inquiry status
 */
export async function updatePriceInquiry(
  id: string,
  data: API.PriceInquiryPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/price-inquiries/${id}`, {
    method: 'PUT',
    data,
  });
}
