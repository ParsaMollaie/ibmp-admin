import {
  deleteServiceComment,
  getServiceComments,
  getServiceCommentStats,
} from '@/services/serviceComment';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Descriptions,
  message,
  Modal,
  Popconfirm,
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

const getCommenterTypeLabel = (
  type: API.ServiceCommentCommenterType,
): string => {
  const labelMap: Record<string, string> = {
    user: 'کاربر',
    owner: 'صاحب خدمت',
  };
  return labelMap[type] || type;
};

const getCommenterTypeColor = (
  type: API.ServiceCommentCommenterType,
): string => {
  const colorMap: Record<string, string> = {
    user: 'blue',
    owner: 'green',
  };
  return colorMap[type] || 'default';
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

const ServiceCommentsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Stats
  const [stats, setStats] = useState<API.ServiceCommentStats>({
    active: 0,
    inactive: 0,
    total: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<API.ServiceCommentItem | null>(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getServiceCommentStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch comment stats:', error);
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

  const handleViewDetail = (record: API.ServiceCommentItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleEdit = (record: API.ServiceCommentItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleDelete = async (record: API.ServiceCommentItem) => {
    try {
      const response = await deleteServiceComment(record.id);
      if (response.success) {
        message.success('نظر با موفقیت حذف شد');
        actionRef.current?.reload();
        fetchStats();
      } else {
        message.error(response.message || 'خطا در حذف نظر');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      message.error('خطا در ارتباط با سرور');
    }
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchStats();
  };

  const handleActiveCardClick = (isActive: string) => {
    formRef.current?.setFieldsValue({ is_active: isActive });
    formRef.current?.submit();
  };

  // ============================================
  // COLUMNS
  // ============================================

  const columns: ProColumns<API.ServiceCommentItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 80,
      hideInSearch: true,
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
      title: 'نظر دهنده',
      dataIndex: 'first_name',
      hideInSearch: true,
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            {record.commenter_type === 'user' ? (
              <Text>
                {record.first_name} {record.last_name}
              </Text>
            ) : (
              <Text style={{ color: '#52c41a' }}>صاحب خدمت</Text>
            )}
            <Tag color={getCommenterTypeColor(record.commenter_type)}>
              {getCommenterTypeLabel(record.commenter_type)}
            </Tag>
          </Space>
          {record.mobile && (
            <Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
              {record.mobile}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'متن نظر',
      dataIndex: 'description',
      hideInSearch: true,
      width: 250,
      ellipsis: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'is_active',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: 'فعال', status: 'Success' },
        false: { text: 'غیرفعال', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.is_active ? 'success' : 'error'}>
          {record.is_active ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
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
    },
    {
      title: 'جستجو',
      dataIndex: 'search',
      hideInTable: true,
      fieldProps: {
        placeholder: 'نام، موبایل یا متن نظر',
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
      title: 'نوع نظر دهنده',
      dataIndex: 'commenter_type',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        user: { text: 'کاربر' },
        owner: { text: 'صاحب خدمت' },
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
      width: 140,
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
          <Popconfirm
            title="آیا از حذف این نظر مطمئن هستید؟"
            onConfirm={() => handleDelete(record)}
            okText="بله"
            cancelText="خیر"
          >
            <Tooltip title="حذف">
              <a style={{ color: '#ff4d4f' }}>
                <DeleteOutlined />
              </a>
            </Tooltip>
          </Popconfirm>
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
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleActiveCardClick('true')}
            style={{ borderTop: '3px solid #52c41a' }}
          >
            <Statistic
              title="فعال"
              value={stats.active}
              loading={statsLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleActiveCardClick('false')}
            style={{ borderTop: '3px solid #ff4d4f' }}
          >
            <Statistic
              title="غیرفعال"
              value={stats.inactive}
              loading={statsLoading}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderTop: '3px solid #1890ff' }}>
            <Statistic
              title="کل"
              value={stats.total}
              loading={statsLoading}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ProTable */}
      <ProTable<API.ServiceCommentItem>
        columns={columns}
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        headerTitle="لیست نظرات"
        request={async (params) => {
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

          const response = await getServiceComments({
            search: params.search,
            service_type: params.service_type,
            commenter_type: params.commenter_type,
            is_active: params.is_active,
            date_from: dateFrom,
            date_to: dateTo,
            page: params.current,
            page_size: params.pageSize,
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
            `نمایش ${range[0]}-${range[1]} از ${total} نظر`,
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
        scroll={{ x: 1200 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Detail Modal */}
      <Modal
        title="جزئیات نظر"
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
            <Descriptions.Item label="کد نظر">
              {currentRecord.code}
            </Descriptions.Item>
            <Descriptions.Item label="نوع نظر دهنده">
              <Tag color={getCommenterTypeColor(currentRecord.commenter_type)}>
                {getCommenterTypeLabel(currentRecord.commenter_type)}
              </Tag>
            </Descriptions.Item>
            {currentRecord.commenter_type === 'user' && (
              <>
                <Descriptions.Item label="نام">
                  {currentRecord.first_name} {currentRecord.last_name}
                </Descriptions.Item>
                <Descriptions.Item label="شماره موبایل">
                  <span dir="ltr">{currentRecord.mobile}</span>
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="متن نظر">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {currentRecord.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="وضعیت">
              <Tag color={currentRecord.is_active ? 'success' : 'error'}>
                {currentRecord.is_active ? 'فعال' : 'غیرفعال'}
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

export default ServiceCommentsPage;
