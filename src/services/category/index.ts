import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all categories with optional filters
 * Used by ProTable to fetch paginated category list
 *
 * @param params.title - Filter by category title (partial match)
 * @param params.status - Filter by status ('active' | 'inactive')
 * @param params.page - Page number for pagination
 * @param params.page_size - Number of items per page
 */
export async function getCategories(params?: {
  title?: string;
  status?: 'active' | 'inactive';
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

/**
 * Get a single category by ID
 * Used when editing a category to get fresh data
 *
 * @param id - Category UUID
 */
export async function getCategory(id: string) {
  return request<API.ApiResponse<API.CategoryItem>>(
    `${API_BASE}/categories/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Create a new category
 *
 * @param data - Category payload
 * @param data.title - Category title (required)
 * @param data.parent_id - Parent category ID (empty string for root category)
 * @param data.priority - Display priority/order
 * @param data.status - 'active' or 'inactive'
 * @param data.image - Base64 encoded image or null
 * @param data.alt_image - Image alt text or null
 */
export async function createCategory(data: API.CategoryPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/categories`, {
    method: 'POST',
    data,
  });
}

/**
 * Update an existing category
 *
 * @param id - Category UUID to update
 * @param data - Updated category payload
 */
export async function updateCategory(id: string, data: API.CategoryPayload) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Delete a category
 * Note: This may fail if the category has children or is in use
 *
 * @param id - Category UUID to delete
 */
export async function deleteCategory(id: string) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all categories for parent selection dropdown
 * Fetches with a large page_size to get all categories at once
 * Only returns active categories suitable for being parents
 */
export async function getCategoriesForSelect() {
  return request<API.ApiResponse<API.PaginatedResponse<API.CategoryItem>>>(
    `${API_BASE}/categories`,
    {
      method: 'GET',
      params: {
        page_size: 100000, // Get all categories
        status: 'active',
      },
    },
  );
}
