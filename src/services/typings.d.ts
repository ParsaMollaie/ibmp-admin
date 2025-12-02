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
}
