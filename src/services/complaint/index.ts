import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of complaints with optional filters
 */
export async function getComplaints(params?: {
  status?: API.ServiceComplaintStatus;
  search?: string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.ServiceComplaintItem>>
  >(`${API_BASE}/service-complaints`, {
    method: 'GET',
    params,
  });
}

/**
 * Get a single complaint by ID
 */
export async function getComplaint(id: string) {
  return request<API.ApiResponse<API.ServiceComplaintItem>>(
    `${API_BASE}/service-complaints/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update complaint status and admin note
 */
export async function updateComplaint(
  id: string,
  data: API.ServiceComplaintPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/service-complaints/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Get complaint statistics by status
 */
export async function getComplaintStats() {
  return request<API.ApiResponse<API.ServiceComplaintStats>>(
    `${API_BASE}/service-complaints/stats`,
    {
      method: 'GET',
    },
  );
}
