import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all news with optional search/filter params
export async function getNewsList(params?: {
  title?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.NewsItem>>>(
    `${API_BASE}/news`,
    {
      method: 'GET',
      params,
    },
  );
}

// Get a single news by ID
export async function getNews(id: string) {
  return request<API.ApiResponse<API.NewsItem>>(`${API_BASE}/news/${id}`, {
    method: 'GET',
  });
}

// Create a new news
export async function createNews(data: API.NewsPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/news`, {
    method: 'POST',
    data,
  });
}

// Update an existing news
export async function updateNews(id: string, data: API.NewsPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/news/${id}`, {
    method: 'PUT',
    data,
  });
}
