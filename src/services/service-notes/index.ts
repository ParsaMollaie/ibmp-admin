import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all notes for a service
 */
export async function getServiceNotes(serviceId: string) {
  return request<API.ApiResponse<API.ServiceNoteItem[]>>(
    `${API_BASE}/services/${serviceId}/notes`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new note for a service
 */
export async function createServiceNote(
  serviceId: string,
  data: API.ServiceNotePayload,
) {
  return request<API.ApiResponse<API.ServiceNoteItem>>(
    `${API_BASE}/services/${serviceId}/notes`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Delete a service note
 */
export async function deleteServiceNote(noteId: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/service-notes/${noteId}`, {
    method: 'DELETE',
  });
}
