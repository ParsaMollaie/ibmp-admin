import { getOrders } from '@/services/order';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Card, Tag } from 'antd';
import jalaliMoment from 'jalali-moment';
import React, { useRef } from 'react';

// Helper function to format dates to Jalali (Persian) calendar
const formatJalaliDate = (dateString: string): string => {
  if (!dateString) return '—';
  return jalaliMoment(dateString).locale('fa').format('jYYYY/jMM/jDD');
};

// Helper function to get status color and label
const getStatusConfig = (
  status: API.OrderStatus,
): { color: string; label: string } => {
  const statusMap: Record<API.OrderStatus, { color: string; label: string }> = {
    paid: { color: 'success', label: 'پرداخت شده' },
    pending: { color: 'warning', label: 'در انتظار پرداخت' },
    cancelled: { color: 'error', label: 'لغو شده' },
    expired: { color: 'default', label: 'منقضی شده' },
  };
  return statusMap[status] || { color: 'default', label: status };
};

// Get service title from either company_service (old) or service (new)
const getServiceTitle = (record: API.OrderItem): string => {
  return record.company_service?.title ?? record.service?.title ?? '—';
};

const OrderPage: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // ProTable action ref - allows programmatic control of table
  const actionRef = useRef<ActionType>();

  // ============================================
  // PROTABLE COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.OrderItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      search: false,
    },
    {
      title: 'کاربر',
      key: 'user_search',
      width: 180,
      render: (_, record) =>
        record.user ? (
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.user.first_name} {record.user.last_name}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.user.username} (کد: {record.user.code})
            </div>
          </div>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
      fieldProps: {
        placeholder: 'کد، نام کاربری یا نام',
      },
    },
    {
      title: 'سرویس',
      key: 'service_title',
      width: 150,
      search: false,
      render: (_, record) => <span>{getServiceTitle(record)}</span>,
    },
    {
      title: 'پلن',
      key: 'plan',
      width: 120,
      search: false,
      render: (_, record) =>
        record.plan ? (
          <div>
            <div>{record.plan.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.plan.month} ماهه
            </div>
          </div>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'مبلغ (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      search: false,
      render: (_, record) => {
        const numericPrice = parseFloat(record.price);
        return numericPrice.toLocaleString('fa-IR');
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      // Make status searchable with select dropdown
      valueType: 'select',
      valueEnum: {
        paid: { text: 'پرداخت شده', status: 'Success' },
        pending: { text: 'در انتظار پرداخت', status: 'Warning' },
        cancelled: { text: 'لغو شده', status: 'Error' },
        expired: { text: 'منقضی شده', status: 'Default' },
      },
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'تاریخ انقضا',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 120,
      search: false,
      render: (_, record) => formatJalaliDate(record.expires_at),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      search: false,
      render: (_, record) => formatJalaliDate(record.created_at),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <ProTable<API.OrderItem>
        columns={columns}
        actionRef={actionRef}
        // ProTable request function - handles params automatically
        request={async (params) => {
          const { status, user_search, current, pageSize } = params;

          const response = await getOrders({
            status: status || undefined,
            user_search: user_search || undefined,
            page: current,
            page_size: pageSize,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        // Toolbar configuration
        toolbar={{
          title: 'مدیریت سفارشات',
        }}
        // Search form configuration
        search={{
          labelWidth: 'auto',
          searchText: 'جستجو',
          resetText: 'بازنشانی',
          collapsed: false, // Keep search form expanded by default
        }}
        // Pagination configuration
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} سفارش`,
        }}
        // Horizontal scroll for better responsiveness
        scroll={{ x: 1100 }}
        // Date formatting
        dateFormatter="string"
        // Header title
        headerTitle={false}
      />
    </Card>
  );
};

export default OrderPage;
