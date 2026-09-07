import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of project visit requests with optional filters
 */
export async function getProjectVisitRequests(params?: {
  status?: API.LeadRequestStatus;
  search?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.ProjectVisitRequestItem>>
  >(`${API_BASE}/project-visit-requests`, {
    method: 'GET',
    params,
  });
}

/**
 * Get a single project visit request by ID
 */
export async function getProjectVisitRequest(id: string) {
  return request<API.ApiResponse<API.ProjectVisitRequestItem>>(
    `${API_BASE}/project-visit-requests/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update project visit request status
 */
export async function updateProjectVisitRequest(
  id: string,
  data: API.ProjectVisitRequestPayload,
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/project-visit-requests/${id}`,
    {
      method: 'PUT',
      data,
    },
  );
}
