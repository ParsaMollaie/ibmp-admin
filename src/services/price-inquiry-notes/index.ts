import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all notes for a price inquiry
 */
export async function getPriceInquiryNotes(priceInquiryId: string) {
  return request<API.ApiResponse<API.PriceInquiryNoteItem[]>>(
    `${API_BASE}/price-inquiries/${priceInquiryId}/notes`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new note for a price inquiry
 */
export async function createPriceInquiryNote(
  priceInquiryId: string,
  data: API.PriceInquiryNotePayload,
) {
  return request<API.ApiResponse<API.PriceInquiryNoteItem>>(
    `${API_BASE}/price-inquiries/${priceInquiryId}/notes`,
    {
      method: 'POST',
      data,
    },
  );
}

/**
 * Delete a price inquiry note
 */
export async function deletePriceInquiryNote(noteId: string) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/price-inquiry-notes/${noteId}`,
    {
      method: 'DELETE',
    },
  );
}
