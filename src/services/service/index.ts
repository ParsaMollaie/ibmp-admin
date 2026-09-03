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
  category_codes?: string[];
  plan_id?: string;
  has_active_plan?: string;
  has_pending_revision?: string;
  expires_within_days?: number;
  created_from?: string;
  created_to?: string;
  expires_from?: string;
  expires_to?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
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
 * Approve a service's pending edit revision — applies the submitted changes onto the
 * live record; the service itself stays approved/public the whole time (see status
 * field, unaffected by revision approval).
 */
export async function approveServiceRevision(id: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${id}/revision/approve`,
    {
      method: 'PUT',
    },
  );
}

/**
 * Reject a service's pending edit revision — the live record is left untouched.
 */
export async function rejectServiceRevision(id: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${id}/revision/reject`,
    {
      method: 'PUT',
    },
  );
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
 * Update the priority of a service
 */
export async function updateServicePriority(id: string, priority: number) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${id}/update-priority`,
    {
      method: 'PUT',
      data: { priority },
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
 * Get service statistics (status + tag counts), optionally filtered by type.
 * Omitting `type` returns combined stats across both service types.
 */
export async function getServiceStats(type?: API.ServiceType) {
  return request<API.ApiResponse<API.ServiceStats>>(
    `${API_BASE}/services/stats`,
    {
      method: 'GET',
      params: { type },
    },
  );
}

/**
 * Get service activity report (aggregated log counts per service)
 */
export async function getServiceActivityReport(params?: {
  start_date?: string;
  end_date?: string;
  type?: API.ServiceType;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.ServiceActivityItem>>
  >(`${API_BASE}/services/activity-report`, {
    method: 'GET',
    params,
  });
}

/**
 * Get service activity trend (total activity per day within a date range)
 */
export async function getServiceActivityTrend(params?: {
  start_date?: string;
  end_date?: string;
  type?: API.ServiceType;
}) {
  return request<API.ApiResponse<API.ServiceActivityTrendPoint[]>>(
    `${API_BASE}/services/activity-trend`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Get promotion-remaining trend (count of promoted services' active plans expiring per day)
 */
export async function getPromotionRemainingTrend(params?: {
  start_date?: string;
  end_date?: string;
  type?: API.ServiceType;
}) {
  return request<API.ApiResponse<API.PromotionRemainingTrendPoint[]>>(
    `${API_BASE}/services/promotion-remaining-trend`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Assign a plan to a service (admin-granted subscription)
 */
export async function assignServicePlan(
  serviceId: string,
  data: { plan_id: string; paid?: boolean; months?: number },
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${serviceId}/assign-plan`,
    {
      method: 'POST',
      data,
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
  has_pending_revision?: string;
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
