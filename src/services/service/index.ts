import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all services with optional filters
 * Works with ProTable's request function
 */
export async function getServices(params?: {
  search?: string;
  type?: API.ServiceType;
  status?: API.ServiceStatus;
  promotion_type?: API.ServicePromotionType;
  tag?: API.ServiceTag;
  user_search?: string;
  category_code?: string;
  plan_id?: string;
  has_active_plan?: string;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.ServiceItem>>>(
    `${API_BASE}/services`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Get a single service by ID
 */
export async function getService(id: string) {
  return request<API.ApiResponse<API.ServiceItem>>(
    `${API_BASE}/services/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update a company-type service
 */
export async function updateServiceCompany(
  id: string,
  data: API.ServiceCompanyPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/services/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Update an engineers-type service
 */
export async function updateServiceEngineers(
  id: string,
  data: API.ServiceEngineersPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/services/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Approve a service
 */
export async function approveService(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/services/${id}/approve`, {
    method: 'PUT',
  });
}

/**
 * Reject a service
 */
export async function rejectService(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/services/${id}/reject`, {
    method: 'PUT',
  });
}

/**
 * Update the category of a service
 */
export async function updateServiceCategory(id: string, categoryId: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${id}/update-category`,
    {
      method: 'PUT',
      data: { category_id: categoryId },
    },
  );
}

/**
 * Update the status of a service
 */
export async function updateServiceStatus(
  id: string,
  status: API.ServiceStatus,
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${id}/update-status`,
    {
      method: 'PUT',
      data: { status },
    },
  );
}

/**
 * Update service tag (regular, most_view, promoted)
 * Note: API endpoint uses 'most-view' (hyphen) for most_view
 */
export async function updateServiceTag(id: string, tag: API.ServiceTag) {
  const urlTag = tag === 'most_view' ? 'most-view' : tag;
  return request<API.ApiResponse<[]>>(`${API_BASE}/services/${id}/${urlTag}`, {
    method: 'PUT',
    data: {},
  });
}

/**
 * Get service statistics (status + tag counts), filtered by type
 */
export async function getServiceStats(type: API.ServiceType) {
  return request<API.ApiResponse<API.ServiceStats>>(
    `${API_BASE}/services/stats`,
    {
      method: 'GET',
      params: { type },
    },
  );
}

// Old separate functions — replaced by getServiceStats(type) which returns both status & tag stats
// export async function getServiceStatusStats() { ... }
// export async function getServiceTagStats() { ... }

/**
 * Bulk update service categories from Excel import
 */
export async function bulkUpdateServiceCategories(
  items: { id: string; category_id: string }[],
) {
  return request<API.ApiResponse<{ updated_count: number }>>(
    `${API_BASE}/services/bulk-update-categories`,
    {
      method: 'PUT',
      data: { items },
    },
  );
}

/**
 * Get services for export (lightweight endpoint)
 */
export async function getServicesForExport(params?: {
  search?: string;
  type?: API.ServiceType;
  status?: API.ServiceStatus;
  promotion_type?: API.ServicePromotionType;
  tag?: API.ServiceTag;
  user_search?: string;
  category_code?: string;
  plan_id?: string;
  has_active_plan?: string;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.ServiceItem>>>(
    `${API_BASE}/services/export`,
    {
      method: 'GET',
      params,
    },
  );
}
