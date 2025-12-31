import { request } from 'umi';

const API_BASE = '/api/v1/admin';

/**
 * Get all company services with optional filters
 *
 * This function is designed to work seamlessly with ProTable's request function.
 * ProTable will pass filter values from the search form, and this function
 * maps them to the API's expected parameters.
 *
 * @param params.title - Filter by service title (text search)
 * @param params.status - Filter by status ('pending' | 'approved' | 'rejected')
 * @param params.type - Filter by type ('regular' | 'promoted')
 * @param params.company_name - Filter by company name
 * @param params.page - Page number for pagination
 * @param params.page_size - Number of items per page
 */
export async function getCompanyServices(params?: {
  title?: string;
  status?: API.CompanyServiceStatus;
  type?: API.CompanyServiceType;
  company_name?: string;
  page?: number;
  page_size?: number;
}) {
  return request<
    API.ApiResponse<API.PaginatedResponse<API.CompanyServiceItem>>
  >(`${API_BASE}/company-services`, {
    method: 'GET',
    params,
  });
}

/**
 * Get a single company service by ID
 *
 * Useful for fetching full details including all nested data
 * (company info, category hierarchy, products, etc.)
 *
 * @param id - The company service's unique identifier (UUID)
 */
export async function getCompanyService(id: string) {
  return request<API.ApiResponse<API.CompanyServiceItem>>(
    `${API_BASE}/company-services/${id}`,
    {
      method: 'GET',
    },
  );
}

/**
 * Update an existing company service
 *
 * Important notes:
 * 1. The payload uses 'social_medias' (with 's'), not 'social_media'
 * 2. Product images can be:
 *    - Existing URL (to keep current image)
 *    - Base64 string (for new upload)
 * 3. All arrays (contact_numbers, social_medias, products) are replaced entirely,
 *    not merged with existing data
 *
 * @param id - The company service's unique identifier
 * @param data - The updated company service data
 */
export async function updateCompanyService(
  id: string,
  data: API.CompanyServicePayload,
) {
  return request<API.ApiResponse<[]>>(`${API_BASE}/company-services/${id}`, {
    method: 'PUT',
    data,
  });
}
