import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get paginated list of news comments across all articles, with optional filters
 */
export async function getNewsComments(params?: {
  status?: 'pending' | 'approved' | 'rejected';
  content?: string;
  news_code?: string;
  page?: number;
  page_size?: number;
  sorter?: string;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.NewsCommentItem>>>(
    `${API_BASE}/news-comments`,
    {
      method: 'GET',
      params,
    },
  );
}

/**
 * Approve or reject a news comment
 */
export async function updateNewsCommentStatus(
  id: string,
  data: API.NewsCommentStatusPayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/news-comments/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Write or update the admin reply on a news comment
 */
export async function replyToNewsComment(
  id: string,
  data: API.NewsCommentReplyPayload,
) {
  return request<API.ApiResponse<[]>>(
    `${API_BASE}/news-comments/${id}/replies`,
    {
      method: 'PUT',
      data,
    },
  );
}
