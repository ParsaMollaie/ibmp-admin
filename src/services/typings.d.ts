/* eslint-disable */

declare namespace API {
  type UserType = 'admin' | 'client';

  interface UserInfo {
    id: string | number;
    code?: number;
    username: string;
    password: string;
    user_type: UserType;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string | null;
    updated_at: string;
    created_at: string;
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

  type definitions_0 = null;
}
