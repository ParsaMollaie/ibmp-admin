import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all categories with optional search/filter params
export async function getCategories(params?: {
  title?: string;
  page?: number;
  page_size?: number;
}) {
  return request<API.ApiResponse<API.PaginatedResponse<API.CategoryItem>>>(
    `${API_BASE}/categories`,
    {
      method: 'GET',
      params,
    },
  );
}

// Get a single category by ID
export async function getCategory(id: string) {
  return request<API.ApiResponse<API.CategoryItem>>(
    `${API_BASE}/categories/${id}`,
    {
      method: 'GET',
    },
  );
}

// Create a new category
export async function createCategory(data: API.CategoryPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/categories`, {
    method: 'POST',
    data,
  });
}

// Update an existing category
export async function updateCategory(id: string, data: API.CategoryPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    data,
  });
}
