import { getOrders } from '@/services/order';
import { getPlans } from '@/services/plan';
import {
  CalendarOutlined,
  CrownOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Row,
  Select,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DatePicker } from 'antd-jalali';
import jalaliMoment from 'jalali-moment';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';

const { Text } = Typography;

// ============================================
// HELPERS
// ============================================

const formatJalaliDate = (dateString: string): string => {
  if (!dateString) return '—';
  return jalaliMoment(dateString).locale('fa').format('jYYYY/jMM/jDD');
};

const formatJalaliDateTime = (dateString: string): string => {
  if (!dateString) return '—';
  return jalaliMoment(dateString).locale('fa').format('jYYYY/jMM/jDD - HH:mm');
};

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

const getServiceTitle = (record: API.OrderItem): string => {
  return record.service?.title ?? '—';
};

// Status card colors
const STATUS_CARD_CONFIG: Record<
  string,
  { borderColor: string; valueColor: string; label: string }
> = {
  paid: {
    borderColor: '#52c41a',
    valueColor: '#52c41a',
    label: 'پرداخت شده',
  },
  pending: {
    borderColor: '#faad14',
    valueColor: '#faad14',
    label: 'در انتظار پرداخت',
  },
  cancelled: {
    borderColor: '#ff4d4f',
    valueColor: '#ff4d4f',
    label: 'لغو شده',
  },
  expired: {
    borderColor: '#d9d9d9',
    valueColor: '#8c8c8c',
    label: 'منقضی شده',
  },
};

// ============================================
// PAGE COMPONENT
// ============================================

const OrderPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Plans list for filter
  const [plansList, setPlansList] = useState<API.PlanItem[]>([]);

  // Status stats
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    paid: 0,
    pending: 0,
    cancelled: 0,
    expired: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      const response = await getPlans({ page_size: 100 });
      if (response.success && response.data?.list) {
        setPlansList(response.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  // Fetch rough status counts (from first page total per status)
  const fetchStatusCounts = async () => {
    setStatsLoading(true);
    try {
      const statuses = ['paid', 'pending', 'cancelled', 'expired'] as const;
      const results = await Promise.all(
        statuses.map((s) => getOrders({ status: s, page: 1, page_size: 1 })),
      );
      const counts: Record<string, number> = {};
      statuses.forEach((s, i) => {
        counts[s] = results[i]?.data?.pagination?.total || 0;
      });
      setStatusCounts(counts);
    } catch (error) {
      console.error('Failed to fetch status counts:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchStatusCounts();
  }, []);

  const handleStatusCardClick = (status: string) => {
    formRef.current?.setFieldsValue({
      status,
      // Clear other filters when clicking stat card
    });
    formRef.current?.submit();
  };

  // ============================================
  // COLUMNS
  // ============================================

  const columns: ProColumns<API.OrderItem>[] = [
    {
      title: 'کد سفارش',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      copyable: true,
      fieldProps: {
        placeholder: 'کد سفارش',
      },
      sorter: true,
    },
    {
      title: 'کاربر',
      key: 'user_search',
      width: 180,
      render: (_, record) =>
        record.user ? (
          <div
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() =>
              history.push(`/user?username=${record.user.username}`)
            }
          >
            <div style={{ fontWeight: 500 }}>
              {record.user.first_name} {record.user.last_name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {record.user.username}
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
      key: 'service_search',
      width: 160,
      ellipsis: true,
      render: (_, record) => {
        const title = getServiceTitle(record);
        const serviceType = record.service?.type;
        return (
          <div>
            <div>{title}</div>
            {serviceType && (
              <Tag
                color={serviceType === 'company' ? 'blue' : 'green'}
                style={{ fontSize: 10, marginTop: 2 }}
              >
                {serviceType === 'company' ? 'شرکت' : 'مهندسی'}
              </Tag>
            )}
          </div>
        );
      },
      fieldProps: {
        placeholder: 'عنوان یا کد سرویس',
      },
    },
    {
      title: 'پلن',
      key: 'plan_display',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        record.plan ? (
          <div>
            <Tag icon={<CrownOutlined />} color="gold">
              {record.plan.name}
            </Tag>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {record.plan.month} ماهه
            </div>
          </div>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'پلن',
      dataIndex: 'plan_id',
      key: 'plan_id',
      hideInTable: true,
      renderFormItem: () => (
        <Select
          allowClear
          placeholder="انتخاب پلن"
          options={plansList.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.month} ماهه)`,
          }))}
        />
      ),
    },
    {
      title: 'مبلغ (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        const numericPrice = parseFloat(record.price);
        return <Text strong>{numericPrice.toLocaleString('fa-IR')}</Text>;
      },
      sorter: true,
    },
    {
      title: 'مالیات (تومان)',
      dataIndex: 'tax',
      key: 'tax',
      width: 110,
      hideInSearch: true,
      render: (_, record) => {
        const numericTax = parseFloat(record.tax || '0');
        return numericTax > 0 ? (
          <Text>{numericTax.toLocaleString('fa-IR')}</Text>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        );
      },
      sorter: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
      sorter: true,
    },
    {
      title: 'تاریخ انقضا',
      key: 'expires_at_display',
      dataIndex: 'expires_at',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.expires_at) return <span style={{ color: '#999' }}>—</span>;
        const isExpired = new Date(record.expires_at) < new Date();
        return (
          <Tooltip title={formatJalaliDateTime(record.expires_at)}>
            <Tag color={isExpired ? 'red' : 'green'}>
              {formatJalaliDate(record.expires_at)}
            </Tag>
          </Tooltip>
        );
      },
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      key: 'created_at_display',
      dataIndex: 'created_at',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <Tooltip title={formatJalaliDateTime(record.created_at)}>
          <span>
            <CalendarOutlined style={{ color: '#8c8c8c', marginLeft: 4 }} />
            {formatJalaliDate(record.created_at)}
          </span>
        </Tooltip>
      ),
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      key: 'updated_at_display',
      dataIndex: 'updated_at',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.updated_at) return <span style={{ color: '#999' }}>—</span>;
        return (
          <Tooltip title={formatJalaliDateTime(record.updated_at)}>
            <span>{formatJalaliDate(record.updated_at)}</span>
          </Tooltip>
        );
      },
      sorter: true,
    },
    {
      title: 'از تاریخ ایجاد',
      dataIndex: 'created_from',
      key: 'created_from',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="از تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'تا تاریخ ایجاد',
      dataIndex: 'created_to',
      key: 'created_to',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="تا تاریخ" style={{ width: '100%' }} />
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Status Stat Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(STATUS_CARD_CONFIG).map(([status, config]) => (
          <Col span={6} key={status}>
            <Card
              hoverable
              onClick={() => handleStatusCardClick(status)}
              style={{ borderTop: `3px solid ${config.borderColor}` }}
            >
              <Statistic
                title={config.label}
                value={statusCounts[status] || 0}
                loading={statsLoading}
                valueStyle={{ color: config.valueColor }}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <ProTable<API.OrderItem>
        headerTitle="مدیریت پرداختی ها"
        columns={columns}
        actionRef={actionRef}
        formRef={formRef}
        request={async (params, sort) => {
          // Format date params
          const createdFrom = params.created_from
            ? typeof params.created_from === 'string'
              ? params.created_from
              : params.created_from.format?.('YYYY-MM-DD')
            : undefined;
          const createdTo = params.created_to
            ? typeof params.created_to === 'string'
              ? params.created_to
              : params.created_to.format?.('YYYY-MM-DD')
            : undefined;

          const response = await getOrders({
            code: params.code ? Number(params.code) : undefined,
            status: params.status || undefined,
            user_search: params.user_search || undefined,
            service_search: params.service_search || undefined,
            plan_id: params.plan_id || undefined,
            created_from: createdFrom,
            created_to: createdTo,
            page: params.current,
            page_size: params.pageSize,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `نمایش ${range[0]}-${range[1]} از ${total} سفارش`,
        }}
        scroll={{ x: 1600 }}
        dateFormatter="string"
        cardBordered
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
      />
    </>
  );
};

export default OrderPage;
