import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all notes for a contact-us submission
 */
export async function getContactUsNotes(contactUsId: string) {
  return request<API.ApiResponse<API.ContactUsNoteItem[]>>(
    `${API_BASE}/contact-us/${contactUsId}/notes`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new note for a contact-us submission
 */
export async function createContactUsNote(
  contactUsId: string,
  data: API.ContactUsNotePayload,
) {
  return request<API.ApiResponse<API.ContactUsNoteItem>>(
    `${API_BASE}/contact-us/${contactUsId}/notes`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Delete a contact-us note
 */
export async function deleteContactUsNote(noteId: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/contact-us-notes/${noteId}`,
    {
      method: 'DELETE',
    },
  );
}
