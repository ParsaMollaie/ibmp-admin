import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all notes for a complaint
 */
export async function getServiceComplaintNotes(complaintId: string) {
  return request<API.ApiResponse<API.ServiceComplaintNoteItem[]>>(
    `${API_BASE}/service-complaints/${complaintId}/notes`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new note for a complaint
 */
export async function createServiceComplaintNote(
  complaintId: string,
  data: API.ServiceComplaintNotePayload,
) {
  return request<API.ApiResponse<API.ServiceComplaintNoteItem>>(
    `${API_BASE}/service-complaints/${complaintId}/notes`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Delete a complaint note
 */
export async function deleteServiceComplaintNote(noteId: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/service-complaint-notes/${noteId}`,
    {
      method: 'DELETE',
    },
  );
}
