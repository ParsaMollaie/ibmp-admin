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
    job_position?: string | null;
    avatar?: string | null;
    password?: string;
    services_count?: number;
    services?: string[];
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
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
    type?: 'company' | 'engineers' | null;
    priority: number;
    status: 'active' | 'inactive';
    image: string | null;
    alt_image: string | null;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
    parent: CategoryParent | null;
  }

  // Category tree item (recursive children for tree view)
  interface CategoryTreeItem extends CategoryItem {
    children?: CategoryTreeItem[];
  }

  // Payload for creating/updating a category
  interface CategoryPayload {
    title: string;
    parent_id: string;
    priority: number;
    status: 'active' | 'inactive';
    image?: string | null;
    alt_image?: string | null;
    type?: 'company' | 'engineers' | null;
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
    publish_at: string | null;
    end_date: string | null;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
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
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
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
    publish_at: string | null;
    end_date: string | null;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
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
    publish_at?: string | null;
    end_date?: string | null;
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
    publish_at: string | null;
    end_date: string | null;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
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
    publish_at?: string | null;
    end_date?: string | null;
  }

  // Category reference nested on a news item
  interface NewsCategory {
    id: string;
    title: string;
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
    code: number;
    status: 'active' | 'inactive';
    categories: NewsCategory[];
    views_count: number;
    rate: number;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  // Article reference nested on a news comment
  interface NewsCommentArticle {
    id: string;
    code: number;
    title: string;
  }

  type NewsCommentStatus = 'pending' | 'approved' | 'rejected';

  // News comment item returned from API (admin, cross-article list)
  interface NewsCommentItem {
    id: string;
    news: NewsCommentArticle | null;
    user: OrderUser | null;
    content: string;
    status: NewsCommentStatus;
    reply: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    created_at: string;
    updated_at: string;
  }

  // Payload for approving/rejecting a news comment
  interface NewsCommentStatusPayload {
    status: 'approved' | 'rejected';
  }

  // Payload for writing/updating a news comment's admin reply
  interface NewsCommentReplyPayload {
    reply: string;
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
    author_id?: string | null;
    status: 'active' | 'inactive';
    category_ids?: string[];
  }

  interface PlanFeature {
    title: string;
    included: boolean;
  }

  interface PlanItem {
    id: string;
    code: number;
    name: string;
    status: 'active' | 'inactive';
    month: number;
    attributes: string; // deprecated — use features
    is_free_trial: boolean;
    features: PlanFeature[] | null;
    price: string;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  interface PlanPayload {
    name: string;
    status: 'active' | 'inactive';
    month: number;
    attributes: string; // deprecated — use features
    is_free_trial: boolean;
    features: PlanFeature[] | null;
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
    job_position?: string;
  }

  // Nested service info within an order (new Service model)
  interface OrderService {
    id: string;
    code: number;
    title: string;
    type: string;
    status: string;
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
    tax: string;
    status: OrderStatus;
    expires_at: string;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
    user: OrderUser;
    service: OrderService | null;
    plan: OrderPlan | null;
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
    notes_count?: number;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  // Contact Us follow-up note item returned from API
  interface ContactUsNoteItem {
    id: string;
    contact_us_id: string;
    content: string;
    user: OrderUser;
    created_at: string;
    updated_at: string;
  }

  interface ContactUsNotePayload {
    content: string;
  }

  // Payload for admin changing a user's password
  interface ChangePasswordPayload {
    password: string;
    repeat_password: string;
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
    postal_code: string | null;
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
    postal_code?: string;
    latitude: number; // API expects number
    longitude: number; // API expects number
    phones: string[];
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
  // SUGGEST CATEGORY
  // ===========================================

  /**
   * Status of a suggest category
   */
  type SuggestCategoryStatus = 'pending' | 'approved' | 'rejected';

  /**
   * Suggest Category item returned from API
   */
  interface SuggestCategoryItem {
    id: string;
    code: number;
    title: string;
    description: string | null;
    status: SuggestCategoryStatus;
    can_approve?: boolean;
    can_reject?: boolean;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  /**
   * Payload for creating/updating a suggest category
   */
  interface SuggestCategoryPayload {
    title: string;
    description?: string | null;
    status?: SuggestCategoryStatus;
  }

  // ===========================================
  // SERVICE (NEW UNIFIED MODEL)
  // ===========================================

  type ServiceType = 'company' | 'engineers';
  type ServicePromotionType = 'regular' | 'promoted';
  type ServiceTag = 'regular' | 'most_view' | 'promoted';
  type ServiceStatus = 'pending' | 'approved' | 'rejected' | 'disable';

  interface ServiceStatusStats {
    pending: number;
    approved: number;
    rejected: number;
    disable: number;
  }

  interface ServiceTagStats {
    regular: number;
    most_view: number;
    promoted: number;
  }

  interface ServiceStats {
    status: ServiceStatusStats;
    tag: ServiceTagStats;
  }

  interface ServiceProvince {
    id: string;
    code: number;
    name: string;
  }

  interface ServiceCity {
    id: string;
    name: string;
  }

  interface ServiceAddress {
    id: string;
    province: ServiceProvince;
    city: ServiceCity;
    address: string | null;
  }

  interface ServiceAddressPayload {
    province_id: string;
    city_id: string;
    address?: string;
  }

  interface ServiceContactNumber {
    type: 'phone' | 'mobile';
    data: string;
  }

  interface ServiceSocialMedia {
    type: 'instagram' | 'telegram' | 'eita' | 'bale' | 'whatsapp' | 'website';
    data: string;
  }

  /**
   * Company sub-object nested within a company-type service
   */
  interface ServiceCompany {
    logo: string | null;
    catalog: string | null;
    address: string | null;
  }

  /**
   * The assigned (leaf) category with a recursive parent chain
   * ({title, parent: {title, parent: {title: root}}}) — leaf-first, reverse
   * to read root → leaf.
   */
  interface ServiceCategoryChild {
    id: string;
    title: string;
    parent: ServiceCategoryChild | null;
  }

  interface ServiceCategory {
    id: string;
    title: string;
    parent: ServiceCategoryChild | null;
  }

  interface ServiceProduct {
    id: string;
    name: string;
    image: string;
    minimum_price: number;
    maximum_price: number;
    status: string;
  }

  interface ServiceWorkSample {
    id: string;
    title: string | null;
    image: string;
    status: string;
  }

  /**
   * Nested active order info within a service (latest paid order)
   */
  interface ServiceActiveOrder {
    id: string;
    plan: { id: string; name: string } | null;
    price: string;
    status: string;
    expires_at: string | null;
    created_at: string;
  }

  /**
   * Service item returned from admin API
   */
  interface ServiceItem {
    id: string;
    code: number;
    title: string;
    summary: string;
    description: string;
    email: string | null;
    website: string | null;
    avatar?: string | null;
    avatar_path?: string | null;
    video?: string | null;
    type: ServiceType;
    promotion_type: ServicePromotionType;
    tag: ServiceTag;
    status: ServiceStatus;
    priority: number;
    province: ServiceProvince | null; // deprecated — use addresses
    city: ServiceCity | null; // deprecated — use addresses
    addresses: ServiceAddress[];
    company: ServiceCompany | null;
    category: ServiceCategory;
    contact_numbers: ServiceContactNumber[];
    social_media: ServiceSocialMedia[];
    products: ServiceProduct[];
    work_samples: ServiceWorkSample[];
    user?: OrderUser;
    latest_active_order?: ServiceActiveOrder | null;
    notes_count?: number;
    can_approve?: boolean;
    can_reject?: boolean;
    contact_profile_id?: string | null;
    contact_profile_title?: string | null;
    can_set_regular?: boolean;
    can_set_most_view?: boolean;
    can_set_promoted?: boolean;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  /**
   * Service note item returned from admin API
   */
  interface ServiceNoteItem {
    id: string;
    service_id: string;
    content: string;
    user: OrderUser;
    created_at: string;
    updated_at: string;
  }

  /**
   * Payload for creating a service note
   */
  interface ServiceNotePayload {
    content: string;
  }

  interface ServiceProductPayload {
    name: string;
    image: string;
    minimum_price: number;
    maximum_price: number;
  }

  interface ServiceWorkSamplePayload {
    title: string;
    image: string;
  }

  /**
   * Payload for updating a company-type service
   */
  interface ServiceCompanyPayload {
    title: string;
    summary?: string;
    description: string;
    email?: string;
    website?: string;
    video?: string | null;
    category_id: string;
    // province_id?: string; // deprecated — use addresses
    // city_id?: string; // deprecated — use addresses
    // address?: string; // deprecated — use addresses
    addresses?: ServiceAddressPayload[];
    logo?: string | null;
    catalog?: string | null;
    contact_numbers: ServiceContactNumber[];
    social_medias: ServiceSocialMedia[];
    products: ServiceProductPayload[];
    contact_profile_id?: string | null;
  }

  // ===========================================
  // SERVICE COMPLAINT
  // ===========================================

  type ServiceComplaintStatus =
    | 'pending'
    | 'in_review'
    | 'resolved'
    | 'rejected';

  interface ServiceComplaintService {
    id: string;
    title: string;
    type: ServiceType;
    code: number;
  }

  interface ServiceComplaintItem {
    id: string;
    code: number;
    service: ServiceComplaintService | null;
    first_name: string;
    last_name: string;
    mobile: string;
    description: string;
    status: ServiceComplaintStatus;
    notes_count?: number;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  interface ServiceComplaintPayload {
    status: ServiceComplaintStatus;
  }

  interface ServiceComplaintStats {
    pending: number;
    in_review: number;
    resolved: number;
    rejected: number;
  }

  // Complaint follow-up note item returned from API
  interface ServiceComplaintNoteItem {
    id: string;
    service_complaint_id: string;
    content: string;
    user: OrderUser;
    created_at: string;
    updated_at: string;
  }

  interface ServiceComplaintNotePayload {
    content: string;
  }

  // --- Service Comments ---
  interface ServiceCommentService {
    id: string;
    title: string;
    type: string;
    code: number;
  }

  type ServiceCommentCommenterType = 'user' | 'owner';

  interface ServiceCommentItem {
    id: string;
    code: number;
    service: ServiceCommentService | null;
    parent_id: string | null;
    commenter_type: ServiceCommentCommenterType;
    first_name: string | null;
    last_name: string | null;
    mobile: string | null;
    description: string;
    is_active: boolean;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
    replies?: ServiceCommentItem[];
  }

  interface ServiceCommentPayload {
    is_active: boolean;
  }

  interface ServiceCommentStats {
    active: number;
    inactive: number;
    total: number;
  }

  /**
   * Service activity report item — aggregated log counts per service
   */
  interface ServiceActivityItem {
    id: string;
    code: number;
    title: string;
    type: ServiceType;
    status: ServiceStatus;
    category_title: string | null;
    user_name: string | null;
    username: string | null;
    view_count: number;
    call_click_count: number;
    website_click_count: number;
    catalog_download_count: number;
    social_click_count: number;
    share_click_count: number;
    total_count: number;
    notes_count?: number;
  }

  interface ServiceActivityTrendPoint {
    date: string;
    total_count: number;
  }

  /**
   * Payload for updating an engineers-type service
   */
  // Settings data (key-value)
  interface SettingsData {
    tax_percentage: string;
  }

  interface ServiceEngineersPayload {
    title: string;
    summary?: string;
    description: string;
    email?: string;
    website?: string;
    video?: string | null;
    avatar?: string | null;
    category_id: string;
    // province_id?: string; // deprecated — use addresses
    // city_id?: string; // deprecated — use addresses
    addresses?: ServiceAddressPayload[];
    contact_numbers: ServiceContactNumber[];
    social_medias: ServiceSocialMedia[];
    work_samples: ServiceWorkSamplePayload[];
    contact_profile_id?: string | null;
  }

  // ===========================================
  // CONTACT PROFILE
  // ===========================================

  interface ContactProfileItem {
    id: string;
    title: string;
    email: string | null;
    website: string | null;
    contact_numbers: ServiceContactNumber[];
    social_medias: ServiceSocialMedia[];
    addresses: ServiceAddress[];
    user?: OrderUser;
    services_count: number;
    created_by?: OrderUser | null;
    updated_by?: OrderUser | null;
    created_at: string;
    updated_at: string;
  }

  interface ContactProfilePayload {
    user_id?: string;
    title: string;
    email?: string | null;
    website?: string | null;
    contact_numbers?: { type: string; data: string }[];
    social_medias?: { type: string; data: string }[];
    addresses?: { province_id: string; city_id: string; address?: string }[];
  }
}
