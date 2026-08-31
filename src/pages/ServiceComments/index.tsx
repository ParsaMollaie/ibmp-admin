import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import {
  deleteServiceComment,
  getServiceComments,
  getServiceCommentStats,
} from '@/services/serviceComment';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Card,
  Col,
  message,
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
  const [pageSize, setPageSize] = usePersistedPageSize('service-comments', 10);

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

  const handleDelete = (record: API.ServiceCommentItem) => {
    Modal.confirm({
      title: 'حذف نظر',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف این نظر مطمئن هستید؟</p>
          <p style={{ fontWeight: 600 }}>{record.description}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
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
      },
    });
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
      sorter: true,
    },
    {
      title: 'خدمت',
      dataIndex: 'service',
      hideInSearch: true,
      width: 200,
      render: (_, record) => {
        if (!record.service) return '—';
        return (
          <Space
            direction="vertical"
            size={0}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              history.push(
                `/services?type=${
                  record.service!.type
                }&search=${encodeURIComponent(record.service!.title)}`,
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
      sorter: true,
    },
    {
      title: 'متن نظر',
      dataIndex: 'description',
      hideInSearch: true,
      width: 250,
      ellipsis: true,
      sorter: true,
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
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      hideInSearch: true,
      width: 150,
      render: (_, record) => (
        <Tooltip title={new Date(record.created_at).toLocaleString('fa-IR')}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <span>{new Date(record.created_at).toLocaleString('fa-IR')}</span>
          </Space>
        </Tooltip>
      ),
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      hideInSearch: true,
      width: 150,
      render: (_, record) => {
        if (!record.updated_at) return '—';
        return new Date(record.updated_at).toLocaleString('fa-IR');
      },
      sorter: true,
    },
    {
      title: 'ایجاد شده توسط',
      dataIndex: 'created_by',
      hideInSearch: true,
      width: 130,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      hideInSearch: true,
      width: 130,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
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
          <Tooltip title="حذف">
            <a
              style={{ color: '#ff4d4f' }}
              onClick={() => handleDelete(record)}
            >
              <DeleteOutlined />
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
        headerTitle="لیست نظرات شرکت ها/خدمات"
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

          const response = await getServiceComments({
            search: params.search,
            service_type: params.service_type,
            commenter_type: params.commenter_type,
            is_active: params.is_active,
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
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
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

      {/* Detail Modal — Thread View */}
      <Modal
        title="جزئیات نظر"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={700}
      >
        {currentRecord && (
          <div>
            {/* Header: Service & commenter info */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              {currentRecord.service && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong>{currentRecord.service.title}</Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, marginRight: 8 }}
                  >
                    کد: {currentRecord.service.code} |{' '}
                    {getServiceTypeLabel(currentRecord.service.type)}
                  </Text>
                </div>
              )}
              <Space size={4}>
                {currentRecord.commenter_type === 'user' ? (
                  <Text>
                    {currentRecord.first_name} {currentRecord.last_name}
                  </Text>
                ) : (
                  <Text style={{ color: '#52c41a' }}>صاحب خدمت</Text>
                )}
                <Tag
                  color={getCommenterTypeColor(currentRecord.commenter_type)}
                >
                  {getCommenterTypeLabel(currentRecord.commenter_type)}
                </Tag>
                {currentRecord.mobile && (
                  <Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                    {currentRecord.mobile}
                  </Text>
                )}
              </Space>
            </div>

            {/* Thread body: chat-like messages */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 500,
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              {[currentRecord, ...(currentRecord.replies || [])].map((msg) => {
                const isOwner = msg.commenter_type === 'owner';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwner ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        background: isOwner ? '#f6ffed' : '#e6f4ff',
                        border: `1px solid ${isOwner ? '#b7eb8f' : '#91caff'}`,
                        borderRadius: 12,
                        ...(isOwner
                          ? { borderTopRight: '4px' }
                          : { borderTopLeft: '4px' }),
                        borderTopRightRadius: isOwner ? 4 : 12,
                        borderTopLeftRadius: isOwner ? 12 : 4,
                        padding: '10px 14px',
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {isOwner ? (
                          <Tag color="green" style={{ margin: 0 }}>
                            صاحب خدمت
                          </Tag>
                        ) : (
                          <Text style={{ fontSize: 13, fontWeight: 500 }}>
                            {msg.first_name} {msg.last_name}
                          </Text>
                        )}
                        <Tag
                          color={msg.is_active ? 'success' : 'error'}
                          style={{ margin: 0 }}
                        >
                          {msg.is_active ? 'فعال' : 'غیرفعال'}
                        </Tag>
                      </div>
                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          fontSize: 14,
                          lineHeight: 1.8,
                        }}
                      >
                        {msg.description}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: '#8c8c8c',
                          textAlign: isOwner ? 'left' : 'right',
                        }}
                      >
                        {new Date(msg.created_at).toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
