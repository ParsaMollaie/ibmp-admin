import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all orders with optional search/filter params
export async function getOrders(params?: {
  page?: number;
  page_size?: number;
  code?: number;
  status?: string;
  user_search?: string;
  service_search?: string;
  plan_id?: string;
  created_from?: string;
  created_to?: string;
  expires_from?: string;
  expires_to?: string;
  sorter?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.OrderItem>>>(
    `${API_BASE}/orders`,
    {
      method: 'GET',
      params,
    },
  );
}
