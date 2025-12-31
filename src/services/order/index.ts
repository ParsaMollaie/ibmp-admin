import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all orders with optional search/filter params
export async function getOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.OrderItem>>>(
    `${API_BASE}/orders`,
    {
      method: 'GET',
      params,
    },
  );
}
