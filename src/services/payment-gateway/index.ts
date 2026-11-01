import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get payment gateways (paginated, ordered by priority)
 * @param params - title/driver filters, page, page_size, sorter
 */
export async function getPaymentGateways(params?: {
  title?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.PaymentGatewayItem>>
  >(`${API_BASE}/payment-gateways`, {
    method: 'GET',
    params,
  });
}

/**
 * Create a payment gateway
 * @param data - gateway fields incl. driver config (e.g. Zarinpal merchant_id)
 */
export async function createPaymentGateway(data: API.PaymentGatewayPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/payment-gateways`, {
    method: 'POST',
    data,
  });
}

/**
 * Update a payment gateway (empty secret config fields keep their stored values)
 * @param id - gateway id
 * @param data - gateway fields
 */
export async function updatePaymentGateway(
  id: string,
  data: API.PaymentGatewayPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/payment-gateways/${id}`, {
    method: 'PUT',
    data,
  });
}
