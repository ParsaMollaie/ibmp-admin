import { request } from 'umi';

const API_BASE = '/api/v1/admin';

export interface DashboardCounts {
  users: number;
  companies: number;
  company_services: number;
  orders: number;
  pending_orders: number;
  paid_orders: number;
}

export interface RegistrationByMonth {
  month: string;
  users: number;
  companies: number;
  services: number;
}

export interface OrderByStatus {
  status: string;
  label: string;
  count: number;
}

export interface RevenueByMonth {
  month: string;
  amount: number;
}

export interface CompanyByProvince {
  province: string;
  count: number;
}

export interface CompanyByTag {
  tag: string;
  label: string;
  count: number;
}

export interface ServiceByStatus {
  status: string;
  label: string;
  count: number;
}

export interface TopCategory {
  category: string;
  count: number;
}

export interface DashboardCharts {
  registrations_by_month: RegistrationByMonth[];
  orders_by_status: OrderByStatus[];
  revenue_by_month: RevenueByMonth[];
  companies_by_province: CompanyByProvince[];
  companies_by_tag: CompanyByTag[];
  services_by_status: ServiceByStatus[];
  top_categories: TopCategory[];
}

export interface DashboardStats {
  counts: DashboardCounts;
  charts: DashboardCharts;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  return request<API.ApiResponse<DashboardStats>>(
    `${API_BASE}/dashboard/stats`,
    {
      method: 'GET',
    },
  );
}
