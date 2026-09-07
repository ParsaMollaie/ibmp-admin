import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all notes for a project visit request
 */
export async function getProjectVisitRequestNotes(
  projectVisitRequestId: string,
) {
  return request<API.ApiResponse<API.ProjectVisitRequestNoteItem[]>>(
    `${API_BASE}/project-visit-requests/${projectVisitRequestId}/notes`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new note for a project visit request
 */
export async function createProjectVisitRequestNote(
  projectVisitRequestId: string,
  data: API.ProjectVisitRequestNotePayload,
) {
  return request<API.ApiResponse<API.ProjectVisitRequestNoteItem>>(
    `${API_BASE}/project-visit-requests/${projectVisitRequestId}/notes`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Delete a project visit request note
 */
export async function deleteProjectVisitRequestNote(noteId: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/project-visit-request-notes/${noteId}`,
    {
      method: 'DELETE',
    },
  );
}
