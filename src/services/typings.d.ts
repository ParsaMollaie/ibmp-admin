/* eslint-disable */

declare namespace API {
  type UserType = 'admin' | 'client';

  // Base response wrapper that all API responses follow
  interface ApiResponse<T> {
    success: boolean;
    code: number;
    message: string;
    data: T;
  }

  // Paginated list response
  interface PaginatedResponse<T> {
    list: T[];
    pagination: {
      total: number;
      current: number;
      page_size: number;
    };
  }

  // Login response data structure
  interface LoginResponse {
    token_type: string;
    access_token: string;
    expires_in: number;
  }

  // User profile returned from /profile endpoint
  interface UserInfo {
    id: string;
    code?: number;
    username: string;
    user_type: UserType;
    email: string;
    first_name: string;
    last_name: string;
    gender?: string | null;
    avatar?: string | null;
    password?: string;
    updated_at?: string;
    created_at?: string;
  }

  // Category parent reference (simplified)
  interface CategoryParent {
    id: string;
    title: string;
  }

  // Category item returned from API
  interface CategoryItem {
    id: string;
    code: number;
    title: string;
    priority: number;
    status: 'active' | 'inactive';
    image: string | null;
    alt_image: string | null;
    created_at: string;
    updated_at: string;
    parent: CategoryParent | null;
  }

  // Payload for creating/updating a category
  interface CategoryPayload {
    title: string;
    parent_id: string;
    priority: number;
    status: 'active' | 'inactive';
    image?: string | null;
    alt_image?: string | null;
  }

  interface CompanyInfo {
    id?: string;
    code?: number;
    title?: string;
    description?: string;
    color?: string;
    type?: string;
    status?: string;
    for?: string;
    image?: string;
    preview?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    creator?: string;
    updatedBy?: string;
  }

  interface SliderItem {
    id: string;
    code: number;
    title: string;
    type: 'main';
    status: 'active' | 'inactive';
    priority: number;
    link: string;
    image: string | null;
    alt_image: string;
    portrait_image: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  }

  interface SocialNetworkItem {
    id: string;
    social: string;
    status: 'active' | 'inactive';
    link: string;
    alt_icon: string;
    icon: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  }

  type definitions_0 = null;

  // Add these inside the API namespace in your typing.d.ts file

  // Advertising section options
  type AdvertisingSection =
    | 'main_page_first_section'
    | 'main_page_second_section'
    | 'main_page_third_section';

  // Advertising item returned from API
  interface AdvertisingItem {
    id: string;
    code: number;
    title: string;
    priority: number;
    status: 'active' | 'inactive';
    section: AdvertisingSection;
    link: string;
    image: string | null;
    portrait_image: string | null;
    alt_image: string;
    created_at: string;
    updated_at: string;
  }

  // Payload for creating/updating advertising
  interface AdvertisingPayload {
    title: string;
    priority: number;
    status: 'active' | 'inactive';
    section: AdvertisingSection;
    link: string;
    image?: string | null;
    portrait_image?: string | null;
    alt_image?: string | null;
  }

  // Business Partner item returned from API
  interface BusinessPartnerItem {
    id: string;
    code: number;
    title: string;
    priority: number;
    status: 'active' | 'inactive';
    link: string;
    image: string | null;
    alt_image: string;
    created_at: string;
    updated_at: string;
  }

  // Payload for creating/updating business partner
  interface BusinessPartnerPayload {
    title: string;
    priority: number;
    status: 'active' | 'inactive';
    link: string;
    image?: string | null;
    alt_image?: string | null;
  }

  // News item returned from API
  interface NewsItem {
    id: string;
    title: string;
    content: string;
    summary: string;
    image: string;
    portrait_image: string;
    preview_image: string;
    alt_image: string;
    publish_at: string;
    code: number;
    status: 'active' | 'inactive';
    study_time: number;
    views_count: number;
    rate: number;
    created_by: string;
    created_at: string;
    updated_at: string;
  }

  // Payload for creating/updating news
  interface NewsPayload {
    title: string;
    content: string;
    summary: string;
    image: string; // Required - base64
    portrait_image: string; // Required - base64
    preview_image: string; // Required - base64
    alt_image: string;
    publish_at: string;
    author_id?: string | null;
    status: 'active' | 'inactive';
    study_time: number;
  }

  interface PlanItem {
    id: string;
    code: number;
    name: string;
    status: 'active' | 'inactive';
    month: number;
    attributes: string;
    price: string;
    created_at: string;
    updated_at: string;
  }

  interface PlanPayload {
    name: string;
    status: 'active' | 'inactive';
    month: number;
    attributes: string;
    price: number;
  }

  // Add these types inside the API namespace in your /services/typing.d.ts file

  // Nested user info within an order
  interface OrderUser {
    id: string;
    code: number;
    username: string;
    user_type: UserType;
    first_name: string;
    last_name: string;
    avatar: string | null;
  }

  // Nested company service info within an order
  interface OrderCompanyService {
    id: string;
    code: number;
    title: string;
    status: string;
    type: string;
  }

  // Nested plan info within an order (reuses PlanItem structure)
  interface OrderPlan {
    id: string;
    code: number;
    name: string;
    status: 'active' | 'inactive';
    month: number;
    attributes: string;
    price: string;
    created_at: string;
    updated_at: string;
  }

  // Order status options
  type OrderStatus = 'paid' | 'pending' | 'cancelled' | 'expired';

  // Order item returned from API
  interface OrderItem {
    id: string;
    code: number;
    price: string;
    status: OrderStatus;
    expires_at: string;
    created_at: string;
    updated_at: string;
    user: OrderUser;
    company_service: OrderCompanyService;
    plan: OrderPlan;
  }

  // Contact Us status options
  type ContactUsStatus = 'pending' | 'followed_up';

  // Contact Us item returned from API
  interface ContactUsItem {
    id: string;
    code: number;
    full_name: string;
    mobile: string;
    email: string | null;
    title: string;
    description: string;
    status: ContactUsStatus;
    created_at: string;
    updated_at: string;
  }

  // Payload for updating contact us status
  interface ContactUsPayload {
    status: ContactUsStatus;
  }

  // Website Contact item returned from API (single record, not a list)
  interface WebsiteContactItem {
    id: string;
    email: string;
    address: string;
    latitude: string; // API returns as string
    longitude: string; // API returns as string
    phones: string[];
    created_at: string;
    updated_at: string;
  }

  // Payload for creating/updating website contact
  interface WebsiteContactPayload {
    email: string;
    address: string;
    latitude: number; // API expects number
    longitude: number; // API expects number
    phones: string[];
  }

  type CompanyTag = 'regular' | 'most-view' | 'promoted';

  // ============================================
  // NESTED OBJECTS IN COMPANY RESPONSE
  // ============================================

  /**
   * Province info within a company (simplified version in list response)
   */
  interface CompanyProvince {
    id: string;
    code: number;
    name: string;
    created_by?: string | null;
    updated_by?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  /**
   * City info within a company (simplified version in list response)
   */
  interface CompanyCity {
    id: string;
    code?: number;
    province_id?: string;
    name: string;
    created_by?: string | null;
    updated_by?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  /**
   * Contact number entry (phone or mobile)
   */
  interface CompanyContactNumber {
    type: 'phone' | 'mobile';
    data: string;
  }

  /**
   * Social media entry
   */
  interface CompanySocialMedia {
    type: 'instagram' | 'telegram' | 'eita' | 'bale' | 'whatsapp' | 'website';
    data: string;
  }

  // ============================================
  // COMPANY ITEM (API RESPONSE)
  // ============================================

  /**
   * Company item returned from API
   * Note: 'tag' is optional as it may not be included in all responses
   */
  interface CompanyItem {
    id: string;
    code: number;
    name: string;
    tag?: CompanyTag; // Made optional since API doesn't always return it
    summary: string;
    description?: string; // May not be in list response
    email?: string; // May not be in list response
    address?: string; // May not be in list response
    logo: string | null;
    catalog: string | null;
    province: CompanyProvince;
    city: CompanyCity;
    contact_numbers: CompanyContactNumber[];
    social_media: CompanySocialMedia[];
  }

  // ============================================
  // COMPANY PAYLOAD (FOR CREATE/UPDATE)
  // ============================================

  /**
   * Payload for creating/updating a company
   *
   * Important notes:
   * - API expects 'social_medias' (with 's') in payload
   * - API returns 'social_media' (without 's') in response
   * - logo and catalog can be base64 (new upload) or null (remove)
   */
  interface CompanyPayload {
    name: string;
    summary: string;
    description: string;
    email: string;
    province_id: string;
    city_id: string;
    address: string;
    logo: string | null; // base64 for new upload, null to remove
    catalog: string | null; // base64 for new upload, null to remove
    contact_numbers: CompanyContactNumber[];
    social_medias: CompanySocialMedia[]; // Note: 'social_medias' with 's'
  }

  // ============================================
  // PROVINCE & CITY (FOR DROPDOWNS)
  // ============================================

  /**
   * Province item for dropdown selection
   */
  interface ProvinceItem {
    id: string;
    code: number;
    name: string;
  }

  /**
   * City item for dropdown selection
   */
  interface CityItem {
    id: string;
    code?: number;
    province_id: string;
    name: string;
  }

  // ===========================================
  // COMPANY SERVICE STATUS & TYPE
  // ===========================================

  /**
   * Status of a company service
   * - 'pending': Awaiting approval
   * - 'approved': Active and visible
   * - 'rejected': Not approved
   */
  type CompanyServiceStatus = 'pending' | 'approved' | 'rejected';

  /**
   * Type/visibility level of a company service
   * - 'regular': Standard visibility (type_value: 0)
   * - 'promoted': Premium/featured visibility (type_value: 1)
   */
  type CompanyServiceType = 'regular' | 'promoted';

  // ===========================================
  // NESTED OBJECTS
  // ===========================================

  /**
   * Simplified province info within company service
   */
  interface CompanyServiceProvince {
    id: string;
    code: number;
    name: string;
  }

  /**
   * Simplified city info within company service
   */
  interface CompanyServiceCity {
    id: string;
    name: string;
  }

  /**
   * Contact number entry (phone or mobile)
   */
  interface CompanyServiceContactNumber {
    type: 'phone' | 'mobile';
    data: string;
  }

  /**
   * Social media entry
   */
  interface CompanyServiceSocialMedia {
    type: 'instagram' | 'telegram' | 'eita' | 'bale' | 'whatsapp' | 'website';
    data: string;
  }

  /**
   * Company info nested within a company service
   */
  interface CompanyServiceCompany {
    id: string;
    code: number;
    name: string;
    summary: string;
    logo: string | null;
    province: CompanyServiceProvince;
    city: CompanyServiceCity;
    contact_numbers: CompanyServiceContactNumber[];
    social_media: CompanyServiceSocialMedia[];
  }

  /**
   * Category parent reference (recursive structure)
   */
  interface CompanyServiceCategoryParent {
    id: string;
    title: string;
    parent: CompanyServiceCategoryParent | null;
  }

  /**
   * Category info with recursive parent structure
   */
  interface CompanyServiceCategory {
    id: string;
    title: string;
    parent: CompanyServiceCategoryParent | null;
  }

  /**
   * Product within a company service
   */
  interface CompanyServiceProduct {
    name: string;
    image: string;
    minimum_price: number;
    maximum_price: number;
  }

  // ===========================================
  // MAIN COMPANY SERVICE ITEM
  // ===========================================

  /**
   * Company Service item returned from API
   */
  interface CompanyServiceItem {
    id: string;
    code: number;
    title: string;
    priority: number;
    status: CompanyServiceStatus;
    type: CompanyServiceType;
    type_value: number;
    description: string;
    created_at: string;
    updated_at: string;
    company: CompanyServiceCompany;
    category: CompanyServiceCategory;
    contact_numbers: CompanyServiceContactNumber[];
    social_media: CompanyServiceSocialMedia[];
    products: CompanyServiceProduct[];
  }

  // ===========================================
  // PAYLOAD FOR UPDATE
  // ===========================================

  /**
   * Product payload for creating/updating
   * Note: image can be a URL (existing) or base64 string (new upload)
   */
  interface CompanyServiceProductPayload {
    name: string;
    image: string;
    minimum_price: number;
    maximum_price: number;
  }

  /**
   * Payload for updating a company service
   * Note: The API uses 'social_medias' (with 's') in the payload,
   * but returns 'social_media' in the response
   */
  interface CompanyServicePayload {
    title: string;
    company_id: string;
    category_id: string;
    description: string;
    contact_numbers: CompanyServiceContactNumber[];
    social_medias: CompanyServiceSocialMedia[];
    products: CompanyServiceProductPayload[];
  }
}
