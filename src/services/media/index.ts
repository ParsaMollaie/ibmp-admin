import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Upload a single base64-encoded image and get back its hosted URL — used by
 * the shared rich-text editor to insert real images instead of inlining base64.
 */
export async function uploadImage(image: string) {
  return request<API.ApiResponse<{ url: string }>>(
    `${API_BASE}/media/upload-image`,
    {
      method: 'POST',
      data: { image },
    },
  );
}
