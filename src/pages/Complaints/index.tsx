import { getComplaints, getComplaintStats } from '@/services/complaint';
import { CalendarOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Descriptions,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { DatePicker } from 'antd-jalali';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import UpdateForm from './components/UpdateForm';

const { Text } = Typography;

// ============================================
// HELPERS
// ============================================

const getStatusColor = (status: API.ServiceComplaintStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    in_review: 'processing',
    resolved: 'success',
    rejected: 'error',
  };
  return colorMap[status] || 'default';
};

const getStatusLabel = (status: API.ServiceComplaintStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار بررسی',
    in_review: 'در حال بررسی',
    resolved: 'حل شده',
    rejected: 'رد شده',
  };
  return labelMap[status] || status;
};

const getServiceTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    company: 'شرکت',
    engineers: 'مهندسان',
  };
  return typeMap[type] || type;
};

// ============================================
// COMPONENT
// ============================================

const ComplaintsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Stats
  const [stats, setStats] = useState<API.ServiceComplaintStats>({
    pending: 0,
    in_review: 0,
    resolved: 0,
    rejected: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<API.ServiceComplaintItem | null>(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getComplaintStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch complaint stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleViewDetail = (record: API.ServiceComplaintItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleEdit = (record: API.ServiceComplaintItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchStats();
  };

  const handleStatusCardClick = (status: API.ServiceComplaintStatus) => {
    formRef.current?.setFieldsValue({ status });
    formRef.current?.submit();
  };

  // ============================================
  // COLUMNS
  // ============================================

  const columns: ProColumns<API.ServiceComplaintItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 80,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'خدمت',
      dataIndex: 'service',
      hideInSearch: true,
      width: 200,
      render: (_, record) => {
        if (!record.service) return '—';
        const serviceRoute =
          record.service.type === 'company'
            ? '/services-company'
            : '/services-engineers';
        return (
          <Space
            direction="vertical"
            size={0}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              history.push(
                `${serviceRoute}?search=${encodeURIComponent(
                  record.service!.title,
                )}`,
              )
            }
          >
            <Text strong style={{ color: '#1890ff' }}>
              {record.service.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              کد: {record.service.code} |{' '}
              {getServiceTypeLabel(record.service.type)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'نام شاکی',
      dataIndex: 'first_name',
      hideInSearch: true,
      width: 160,
      render: (_, record) => `${record.first_name} ${record.last_name}`,
      sorter: true,
    },
    {
      title: 'شماره موبایل',
      dataIndex: 'mobile',
      hideInSearch: true,
      width: 130,
      render: (_, record) => <span dir="ltr">{record.mobile}</span>,
      sorter: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: {
        pending: { text: 'در انتظار بررسی', status: 'Warning' },
        in_review: { text: 'در حال بررسی', status: 'Processing' },
        resolved: { text: 'حل شده', status: 'Success' },
        rejected: { text: 'رد شده', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusLabel(record.status)}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: 'تاریخ',
      dataIndex: 'created_at',
      hideInSearch: true,
      width: 120,
      render: (_, record) => (
        <Tooltip title={new Date(record.created_at).toLocaleString('fa-IR')}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <span>
              {new Date(record.created_at).toLocaleDateString('fa-IR')}
            </span>
          </Space>
        </Tooltip>
      ),
      sorter: true,
    },
    {
      title: 'جستجو',
      dataIndex: 'search',
      hideInTable: true,
      fieldProps: {
        placeholder: 'نام، نام خانوادگی یا موبایل',
      },
    },
    {
      title: 'نوع خدمت',
      dataIndex: 'service_type',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        company: { text: 'شرکت' },
        engineers: { text: 'مهندسان' },
      },
    },
    {
      title: 'از تاریخ',
      dataIndex: 'date_from',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="از تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'date_to',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="تا تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="مشاهده جزئیات">
            <a onClick={() => handleViewDetail(record)}>
              <EyeOutlined />
            </a>
          </Tooltip>
          <Tooltip title="بروزرسانی">
            <a onClick={() => handleEdit(record)}>
              <EditOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Stat Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('pending')}
            style={{ borderTop: '3px solid #faad14' }}
          >
            <Statistic
              title="در انتظار بررسی"
              value={stats.pending}
              loading={statsLoading}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('in_review')}
            style={{ borderTop: '3px solid #1890ff' }}
          >
            <Statistic
              title="در حال بررسی"
              value={stats.in_review}
              loading={statsLoading}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('resolved')}
            style={{ borderTop: '3px solid #52c41a' }}
          >
            <Statistic
              title="حل شده"
              value={stats.resolved}
              loading={statsLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('rejected')}
            style={{ borderTop: '3px solid #ff4d4f' }}
          >
            <Statistic
              title="رد شده"
              value={stats.rejected}
              loading={statsLoading}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ProTable */}
      <ProTable<API.ServiceComplaintItem>
        columns={columns}
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        headerTitle="لیست شکایات"
        request={async (params, sort) => {
          const dateFrom = params.date_from
            ? typeof params.date_from === 'string'
              ? params.date_from
              : params.date_from.format?.('YYYY-MM-DD')
            : undefined;
          const dateTo = params.date_to
            ? typeof params.date_to === 'string'
              ? params.date_to
              : params.date_to.format?.('YYYY-MM-DD')
            : undefined;

          const response = await getComplaints({
            status: params.status,
            search: params.search,
            service_type: params.service_type,
            date_from: dateFrom,
            date_to: dateTo,
            page: params.current,
            page_size: params.pageSize,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
          });

          return {
            data: response.data?.list || [],
            success: response.success,
            total: response.data?.pagination?.total || 0,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `نمایش ${range[0]}-${range[1]} از ${total} شکایت`,
        }}
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        scroll={{ x: 1000 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Detail Modal */}
      <Modal
        title="جزئیات شکایت"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={600}
      >
        {currentRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="کد شکایت">
              {currentRecord.code}
            </Descriptions.Item>
            <Descriptions.Item label="نام شاکی">
              {currentRecord.first_name} {currentRecord.last_name}
            </Descriptions.Item>
            <Descriptions.Item label="شماره موبایل">
              <span dir="ltr">{currentRecord.mobile}</span>
            </Descriptions.Item>
            <Descriptions.Item label="شرح شکایت">
              {currentRecord.description}
            </Descriptions.Item>
            <Descriptions.Item label="وضعیت">
              <Tag color={getStatusColor(currentRecord.status)}>
                {getStatusLabel(currentRecord.status)}
              </Tag>
            </Descriptions.Item>
            {currentRecord.service && (
              <>
                <Descriptions.Item label="عنوان خدمت">
                  {currentRecord.service.title}
                </Descriptions.Item>
                <Descriptions.Item label="کد خدمت">
                  {currentRecord.service.code}
                </Descriptions.Item>
                <Descriptions.Item label="نوع خدمت">
                  {getServiceTypeLabel(currentRecord.service.type)}
                </Descriptions.Item>
              </>
            )}
            {currentRecord.admin_note && (
              <Descriptions.Item label="یادداشت مدیر">
                {currentRecord.admin_note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="تاریخ ثبت">
              {new Date(currentRecord.created_at).toLocaleString('fa-IR')}
            </Descriptions.Item>
            <Descriptions.Item label="آخرین بروزرسانی">
              {new Date(currentRecord.updated_at).toLocaleString('fa-IR')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Update Modal */}
      <UpdateForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleUpdateSuccess}
        record={currentRecord}
      />
    </>
  );
};

export default ComplaintsPage;
