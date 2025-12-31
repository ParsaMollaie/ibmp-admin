import { getOrders } from '@/services/order';
import { useRequest } from '@umijs/max';
import { Card, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import jalaliMoment from 'jalali-moment';
import React, { useState } from 'react';

const { Title } = Typography;

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

const OrderPage: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Filter state for status dropdown
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  // useRequest hook provides automatic loading state management
  // refreshDeps ensures data is refetched when filters change
  const { data: ordersData, loading } = useRequest(
    () => getOrders({ status: statusFilter }),
    {
      refreshDeps: [statusFilter],
    },
  );

  // Safely extract the list from nested API response structure
  const orders = ordersData?.data?.list || [];

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Handle status filter change
  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  // ============================================
  // TABLE COLUMN DEFINITIONS
  // ============================================

  const columns: ColumnsType<API.OrderItem> = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
    },
    {
      title: 'کاربر',
      key: 'user',
      width: 180,
      // Render user's full name and username
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.user.first_name} {record.user.last_name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.user.username}
          </div>
        </div>
      ),
    },
    {
      title: 'سرویس',
      key: 'company_service',
      width: 150,
      // Render company service title
      render: (_, record) => <span>{record.company_service.title}</span>,
    },
    {
      title: 'پلن',
      key: 'plan',
      width: 120,
      // Render plan name with duration
      render: (_, record) => (
        <div>
          <div>{record.plan.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.plan.month} ماهه
          </div>
        </div>
      ),
    },
    {
      title: 'مبلغ (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      // Format price with Persian locale thousand separators
      render: (price: string) => {
        const numericPrice = parseFloat(price);
        return numericPrice.toLocaleString('fa-IR');
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      // Render status as colored tag with Persian label
      render: (status: API.OrderStatus) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'تاریخ انقضا',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 120,
      // Format expiry date to Jalali calendar
      render: (date: string) => formatJalaliDate(date),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      // Format creation date to Jalali calendar
      render: (date: string) => formatJalaliDate(date),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      {/* Header section with title and filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          مدیریت سفارشات
        </Title>
        <Space>
          {/* Status filter dropdown */}
          <Select
            placeholder="فیلتر وضعیت"
            allowClear
            style={{ width: 180 }}
            onChange={handleStatusChange}
            options={[
              { label: 'پرداخت شده', value: 'paid' },
              { label: 'در انتظار پرداخت', value: 'pending' },
              { label: 'لغو شده', value: 'cancelled' },
              { label: 'منقضی شده', value: 'expired' },
            ]}
          />
        </Space>
      </div>

      {/* Main data table */}
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        // Horizontal scroll for better responsiveness with many columns
        scroll={{ x: 1100 }}
        pagination={{
          total: ordersData?.data?.pagination?.total || 0,
          pageSize: ordersData?.data?.pagination?.page_size || 10,
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} سفارش`,
        }}
      />
    </Card>
  );
};

export default OrderPage;
