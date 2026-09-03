import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all work samples for a service
 */
export async function getServiceWorkSamples(serviceId: string) {
  return request<API.ApiResponse<API.ServiceWorkSample[]>>(
    `${API_BASE}/services/${serviceId}/work-samples`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new work sample for a service
 */
export async function createServiceWorkSample(
  serviceId: string,
  data: API.ServiceWorkSamplePayload,
) {
  return request<API.ApiResponse<API.ServiceWorkSample>>(
    `${API_BASE}/services/${serviceId}/work-samples`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Update a service work sample
 */
export async function updateServiceWorkSample(
  serviceId: string,
  workSampleId: string,
  data: Partial<API.ServiceWorkSamplePayload>,
) {
  return request<API.ApiResponse<API.ServiceWorkSample>>(
    `${API_BASE}/services/${serviceId}/work-samples/${workSampleId}`,
    {
      method: 'PUT',
      data,
    },
  );
}

/**
 * Toggle a service work sample's active/inactive status
 */
export async function toggleServiceWorkSampleStatus(
  serviceId: string,
  workSampleId: string,
) {
  return request<API.ApiResponse<API.ServiceWorkSample>>(
    `${API_BASE}/services/${serviceId}/work-samples/${workSampleId}/toggle-status`,
    {
      method: 'PATCH',
    },
  );
}

/**
 * Delete a service work sample
 */
export async function deleteServiceWorkSample(
  serviceId: string,
  workSampleId: string,
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/services/${serviceId}/work-samples/${workSampleId}`,
    {
      method: 'DELETE',
    },
  );
}
