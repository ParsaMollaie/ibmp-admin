import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all products for a service
 */
export async function getServiceProducts(serviceId: string) {
  return request<API.ApiResponse<API.ServiceProduct[]>>(
    `${API_BASE}/services/${serviceId}/products`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new product for a service
 */
export async function createServiceProduct(
  serviceId: string,
  data: API.ServiceProductPayload,
) {
  return request<API.ApiResponse<API.ServiceProduct>>(
    `${API_BASE}/services/${serviceId}/products`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Update a service product
 */
export async function updateServiceProduct(
  serviceId: string,
  productId: string,
  data: Partial<API.ServiceProductPayload>,
) {
  return request<API.ApiResponse<API.ServiceProduct>>(
    `${API_BASE}/services/${serviceId}/products/${productId}`,
    {
      method: 'PUT',
      data,
    },
  );
}

/**
 * Toggle a service product's active/inactive status
 */
export async function toggleServiceProductStatus(
  serviceId: string,
  productId: string,
) {
  return request<API.ApiResponse<API.ServiceProduct>>(
    `${API_BASE}/services/${serviceId}/products/${productId}/toggle-status`,
    {
      method: 'PATCH',
    },
  );
}

/**
 * Delete a service product
 */
export async function deleteServiceProduct(
  serviceId: string,
  productId: string,
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${serviceId}/products/${productId}`,
    {
      method: 'DELETE',
    },
  );
}
