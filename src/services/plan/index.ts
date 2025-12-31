import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all plans with optional search/filter params
export async function getPlans(params?: {
  name?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.PlanItem>>>(
    `${API_BASE}/plans`,
    {
      method: 'GET',
      params,
    },
  );
}

// Get a single plan by ID
export async function getPlan(id: string) {
  return request<API.ApiResponse<API.PlanItem>>(`${API_BASE}/plans/${id}`, {
    method: 'GET',
  });
}

// Create a new plan
export async function createPlan(data: API.PlanPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/plans`, {
    method: 'POST',
    data,
  });
}

// Update an existing plan
export async function updatePlan(id: string, data: API.PlanPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/plans/${id}`, {
    method: 'PUT',
    data,
  });
}
