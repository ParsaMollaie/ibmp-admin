import { getCategoryTree } from '@/services/category';
import {
  approveCompanyService,
  getCompanyServices,
  getCompanyServicesForExport,
  getCompanyServiceStats,
  rejectCompanyService,
} from '@/services/company-service';
import { exportAllToExcel, ExportColumn } from '@/utils/exportExcel';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  ShoppingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Cascader,
  Col,
  Descriptions,
  Divider,
  Image,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import UpdateCategoryForm from './components/UpdateCategoryForm';
import UpdateForm from './components/UpdateForm';
import UpdateStatusForm from './components/UpdateStatusForm';

const { Title, Text, Paragraph } = Typography;

// ============================================
// CONFIGURATION: Enums for ProTable
// ============================================

/**
 * Status configuration for ProTable's valueEnum feature
 * Maps API status values to display text and status colors
 */
const statusEnum: Record<string, { text: string; status: string }> = {
  pending: { text: 'در انتظار تایید', status: 'Warning' },
  approved: { text: 'تایید شده', status: 'Success' },
  rejected: { text: 'رد شده', status: 'Error' },
  disable: { text: 'غیرفعال', status: 'Default' },
};

/**
 * Type configuration for ProTable's valueEnum feature
 * Maps API type values to display text and status colors
 */
const typeEnum: Record<string, { text: string; status: string }> = {
  regular: { text: 'عادی', status: 'Default' },
  promoted: { text: 'ویژه', status: 'Processing' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get color for status Tag component
 */
const getStatusColor = (status: API.CompanyServiceStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    disable: 'default',
  };
  return colorMap[status] || 'default';
};

/**
 * Get Persian label for status
 */
const getStatusLabel = (status: API.CompanyServiceStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    disable: 'غیرفعال',
  };
  return labelMap[status] || status;
};

/**
 * Get color for type Tag component
 */
const getTypeColor = (type: API.CompanyServiceType): string => {
  const colorMap: Record<string, string> = {
    regular: 'default',
    promoted: 'blue',
  };
  return colorMap[type] || 'default';
};

/**
 * Get Persian label for type
 */
const getTypeLabel = (type: API.CompanyServiceType): string => {
  const labelMap: Record<string, string> = {
    regular: 'عادی',
    promoted: 'ویژه',
  };
  return labelMap[type] || type;
};

/**
 * Get Persian label for contact type
 */
const getContactTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    phone: 'تلفن',
    mobile: 'موبایل',
  };
  return typeMap[type] || type;
};

/**
 * Get Persian label for social media type
 */
const getSocialTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    instagram: 'اینستاگرام',
    telegram: 'تلگرام',
    eita: 'ایتا',
    bale: 'بله',
    whatsapp: 'واتساپ',
    website: 'وب‌سایت',
  };
  return typeMap[type] || type;
};

/**
 * Build full category path from recursive parent structure
 * Example: "اسکلت و سازه > قالب بندی بتن > روغن قالب"
 */
const buildCategoryPath = (
  category: API.CompanyServiceCategory | null,
): string => {
  if (!category) return '—';

  const parts: string[] = [];

  // Recursive function to collect all parent titles
  const collectParents = (cat: API.CompanyServiceCategoryParent | null) => {
    if (cat) {
      collectParents(cat.parent);
      parts.push(cat.title);
    }
  };

  collectParents(category.parent);
  parts.push(category.title);

  return parts.join(' > ');
};

/**
 * Format price to Persian locale with currency
 */
const formatPrice = (price: number): string => {
  if (price === 0) return 'رایگان';
  return `${price.toLocaleString('fa-IR')} تومان`;
};

// Export column definitions with Persian headers
const exportColumns: ExportColumn[] = [
  { title: 'کد', dataIndex: 'code' },
  { title: 'عنوان', dataIndex: 'title' },
  { title: 'نام شرکت', dataIndex: ['company', 'name'] },
  { title: 'دسته‌بندی', dataIndex: ['category', 'title'] },
  {
    title: 'وضعیت',
    dataIndex: 'status',
    render: (value) => {
      const statusMap: Record<string, string> = {
        pending: 'در انتظار تایید',
        approved: 'تایید شده',
        rejected: 'رد شده',
        disable: 'غیرفعال',
      };
      return statusMap[value] || value;
    },
  },
  {
    title: 'نوع',
    dataIndex: 'type',
    render: (value) => {
      const typeMap: Record<string, string> = {
        regular: 'عادی',
        promoted: 'ویژه',
      };
      return typeMap[value] || value;
    },
  },
  { title: 'اولویت', dataIndex: 'priority' },
];

const CompanyServicePage: React.FC = () => {
  // ============================================
  // REFS & STATE
  // ============================================

  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Status stats
  const [statusStats, setStatusStats] = useState<API.CompanyServiceStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    disable: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Category tree for Cascader
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  const fetchStatusStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getCompanyServiceStats();
      if (response.success && response.data) {
        setStatusStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch status stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCategoryTree = async () => {
    try {
      const response = await getCategoryTree();
      if (response.success && response.data) {
        setCategoryTree(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
    }
  };

  useEffect(() => {
    fetchStatusStats();
    fetchCategoryTree();
  }, []);

  const buildCascaderOptions = (
    items: API.CategoryTreeItem[],
  ): { value: string; label: string; children?: any[] }[] => {
    return items.map((item) => ({
      value: String(item.code),
      label: item.title,
      children:
        item.children && item.children.length > 0
          ? buildCascaderOptions(item.children)
          : undefined,
    }));
  };

  // Modal visibility states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateCategoryModalVisible, setUpdateCategoryModalVisible] =
    useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Currently selected record
  const [currentRecord, setCurrentRecord] =
    useState<API.CompanyServiceItem | null>(null);

  // Export states
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Handle export to Excel with batch fetching (uses lightweight export endpoint)
  const handleExport = async () => {
    setExporting(true);
    const messageKey = 'export-progress';
    message.loading({
      content: 'در حال دانلود...',
      key: messageKey,
      duration: 0,
    });

    try {
      const result = await exportAllToExcel(
        getCompanyServicesForExport,
        filterParams,
        exportColumns,
        'company-services',
        500, // Batch size
        (loaded, total) => {
          message.loading({
            content: `در حال دانلود... ${loaded} از ${total}`,
            key: messageKey,
            duration: 0,
          });
        },
      );

      if (result.success) {
        message.success({
          content: `${result.count} رکورد با موفقیت دانلود شد`,
          key: messageKey,
        });
      } else {
        message.warning({
          content: 'داده‌ای برای دانلود وجود ندارد',
          key: messageKey,
        });
      }
    } catch (error) {
      message.error({ content: 'خطا در دانلود فایل اکسل', key: messageKey });
    } finally {
      setExporting(false);
    }
  };

  // Open update modal
  const handleEdit = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Open detail view modal
  const handleViewDetail = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // Handle successful update
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // Open update category modal
  const handleUpdateCategory = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setUpdateCategoryModalVisible(true);
  };

  // Handle successful category update
  const handleUpdateCategorySuccess = () => {
    setUpdateCategoryModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // Open status change modal
  const handleChangeStatus = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setStatusModalVisible(true);
  };

  // Handle successful status update
  const handleStatusUpdateSuccess = () => {
    setStatusModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchStatusStats();
  };

  // Handle approve action with confirmation
  const handleApprove = (record: API.CompanyServiceItem) => {
    Modal.confirm({
      title: 'تایید سرویس',
      content: `آیا از تایید سرویس "${record.title}" اطمینان دارید؟`,
      okText: 'بله، تایید شود',
      cancelText: 'انصراف',
      okType: 'primary',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await approveCompanyService(record.id);
          if (response.success) {
            message.success('سرویس با موفقیت تایید شد');
            actionRef.current?.reload();
            fetchStatusStats();
          } else {
            message.error(response.message || 'خطا در تایید سرویس');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Handle reject action with confirmation
  const handleReject = (record: API.CompanyServiceItem) => {
    Modal.confirm({
      title: 'رد سرویس',
      content: `آیا از رد سرویس "${record.title}" اطمینان دارید؟`,
      okText: 'بله، رد شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await rejectCompanyService(record.id);
          if (response.success) {
            message.success('سرویس با موفقیت رد شد');
            actionRef.current?.reload();
            fetchStatusStats();
          } else {
            message.error(response.message || 'خطا در رد سرویس');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.CompanyServiceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'عنوان سرویس',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: 'عنوان سرویس را وارد کنید',
      },
    },
    {
      title: 'شرکت',
      dataIndex: ['company', 'name'],
      key: 'company_name',
      width: 150,
      ellipsis: true,
      // Custom render to show company logo + name
      render: (_, record) => (
        <Space>
          {record.company.logo && (
            <Image
              src={record.company.logo}
              alt={record.company.name}
              width={24}
              height={24}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          )}
          <a
            onClick={() =>
              history.push(
                `/company?name=${encodeURIComponent(record.company.name)}`,
              )
            }
          >
            {record.company.name}
          </a>
        </Space>
      ),
      fieldProps: {
        placeholder: 'نام شرکت را وارد کنید',
      },
    },
    {
      title: 'دسته‌بندی',
      dataIndex: ['category', 'title'],
      key: 'category',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={buildCategoryPath(record.category)}>
          <span>{record.category?.title || '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category_code',
      key: 'category_code',
      hideInTable: true,
      renderFormItem: () => (
        <Cascader
          options={buildCascaderOptions(categoryTree)}
          changeOnSelect
          showSearch={{
            filter: (inputValue, path) =>
              path.some((option) =>
                (option.label as string)
                  .toLowerCase()
                  .includes(inputValue.toLowerCase()),
              ),
          }}
          placeholder="انتخاب دسته‌بندی"
        />
      ),
    },
    {
      title: 'کاربر',
      key: 'user_search',
      width: 150,
      render: (_, record) =>
        record.user ? (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() =>
              history.push(`/user?username=${record.user!.username}`)
            }
          >
            <div style={{ fontWeight: 500 }}>
              {record.user.first_name} {record.user.last_name}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.user.username}
            </div>
            {record.user.job_position && (
              <div style={{ fontSize: 12, color: '#888' }}>
                {record.user.job_position}
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
      fieldProps: {
        placeholder: 'کد، نام کاربری یا نام',
      },
    },
    {
      title: 'محصولات',
      dataIndex: 'products',
      key: 'products',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tag icon={<ShoppingOutlined />}>
          {record.products?.length || 0} محصول
        </Tag>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusLabel(record.status)}
        </Tag>
      ),
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: typeEnum,
      render: (_, record) => (
        <Tag color={getTypeColor(record.type)}>{getTypeLabel(record.type)}</Tag>
      ),
      fieldProps: {
        placeholder: 'انتخاب نوع',
      },
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 180,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {/* Approve Button - only shown when can_approve is true */}
          {record.can_approve && (
            <Tooltip title="تایید سرویس">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleApprove(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          {/* Reject Button - only shown when can_reject is true */}
          {record.can_reject && (
            <Tooltip title="رد سرویس">
              <Button
                type="text"
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                onClick={() => handleReject(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          {/* Change Status Button */}
          <Tooltip title="تغییر وضعیت">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={() => handleChangeStatus(record)}
            />
          </Tooltip>

          {/* View Detail Button - always visible */}
          <Tooltip title="مشاهده جزئیات">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>

          {/* Update Category Button - always visible */}
          <Tooltip title="تغییر دسته‌بندی">
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={() => handleUpdateCategory(record)}
            />
          </Tooltip>

          {/* Edit Button - always visible */}
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================
  // PRODUCTS TABLE COLUMNS (for detail modal)
  // ============================================

  const productColumns = [
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string) =>
        image ? (
          <Image
            src={image}
            alt="product"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: 'نام محصول',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'حداقل قیمت',
      dataIndex: 'minimum_price',
      key: 'minimum_price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'حداکثر قیمت',
      dataIndex: 'maximum_price',
      key: 'maximum_price',
      render: (price: number) => formatPrice(price),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  const handleStatusCardClick = (status: API.CompanyServiceStatus) => {
    formRef.current?.setFieldsValue({ status });
    formRef.current?.submit();
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('pending')}
            style={{ borderTop: '3px solid #faad14' }}
          >
            <Statistic
              title="در انتظار تایید"
              value={statusStats.pending}
              loading={statsLoading}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('approved')}
            style={{ borderTop: '3px solid #52c41a' }}
          >
            <Statistic
              title="تایید شده"
              value={statusStats.approved}
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
              value={statusStats.rejected}
              loading={statsLoading}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            hoverable
            onClick={() => handleStatusCardClick('disable')}
            style={{ borderTop: '3px solid #d9d9d9' }}
          >
            <Statistic
              title="غیرفعال"
              value={statusStats.disable}
              loading={statsLoading}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable<API.CompanyServiceItem>
        headerTitle="مدیریت سرویس‌های شرکت‌ها"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            دانلود اکسل
          </Button>,
        ]}
        request={async (params) => {
          // Store filter params for export (excluding pagination params)
          const filters = Object.fromEntries(
            Object.entries(params).filter(
              ([key]) => !['current', 'pageSize'].includes(key),
            ),
          );
          setFilterParams(filters);

          // Extract last element from Cascader array for category_code
          const categoryCodeArr = params.category_code;
          const categoryCode =
            Array.isArray(categoryCodeArr) && categoryCodeArr.length > 0
              ? categoryCodeArr[categoryCodeArr.length - 1]
              : undefined;

          const response = await getCompanyServices({
            title: params.title,
            status: params.status,
            type: params.type,
            company_name: params.company_name,
            user_search: params.user_search,
            category_code: categoryCode,
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
            `نمایش ${range[0]}-${range[1]} از ${total} سرویس`,
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

      {/* Update Category Modal */}
      <UpdateCategoryForm
        visible={updateCategoryModalVisible}
        onCancel={() => {
          setUpdateCategoryModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleUpdateCategorySuccess}
        record={currentRecord}
      />

      {/* Update Status Modal */}
      <UpdateStatusForm
        visible={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleStatusUpdateSuccess}
        record={currentRecord}
      />

      {/* Detail View Modal */}
      <Modal
        title="جزئیات سرویس"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={900}
      >
        {currentRecord && (
          <div>
            {/* Service Header */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {currentRecord.title}
                  </Title>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={getStatusColor(currentRecord.status)}>
                      {getStatusLabel(currentRecord.status)}
                    </Tag>
                    <Tag color={getTypeColor(currentRecord.type)}>
                      {getTypeLabel(currentRecord.type)}
                    </Tag>
                    <Text type="secondary">کد: {currentRecord.code}</Text>
                    <Text type="secondary">
                      اولویت: {currentRecord.priority}
                    </Text>
                  </Space>
                </div>
              </div>
            </Card>

            {/* Company Info */}
            <Divider orientation="right">اطلاعات شرکت</Divider>
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginBottom: 16,
                padding: 12,
                background: '#fafafa',
                borderRadius: 8,
              }}
            >
              {currentRecord.company.logo && (
                <Image
                  src={currentRecord.company.logo}
                  alt={currentRecord.company.name}
                  width={60}
                  height={60}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div>
                <Text strong>{currentRecord.company.name}</Text>
                <br />
                <Text type="secondary">
                  {currentRecord.company.province.name} -{' '}
                  {currentRecord.company.city.name}
                </Text>
              </div>
            </div>

            {/* Category */}
            <Divider orientation="right">دسته‌بندی</Divider>
            <Paragraph>
              <Tag color="blue">
                {buildCategoryPath(currentRecord.category)}
              </Tag>
            </Paragraph>

            {/* Description */}
            <Divider orientation="right">توضیحات</Divider>
            <Paragraph>{currentRecord.description}</Paragraph>

            {/* Contact Numbers */}
            {currentRecord.contact_numbers.length > 0 && (
              <>
                <Divider orientation="right">شماره‌های تماس سرویس</Divider>
                <Descriptions bordered column={2} size="small">
                  {currentRecord.contact_numbers.map((contact, index) => (
                    <Descriptions.Item
                      key={index}
                      label={getContactTypeLabel(contact.type)}
                    >
                      <span
                        style={{ direction: 'ltr', display: 'inline-block' }}
                      >
                        {contact.data}
                      </span>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            {/* Social Media */}
            {currentRecord.social_media.length > 0 && (
              <>
                <Divider orientation="right">شبکه‌های اجتماعی</Divider>
                <Descriptions bordered column={1} size="small">
                  {currentRecord.social_media.map((social, index) => (
                    <Descriptions.Item
                      key={index}
                      label={getSocialTypeLabel(social.type)}
                    >
                      <a
                        href={social.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ direction: 'ltr', display: 'inline-block' }}
                      >
                        <LinkOutlined style={{ marginLeft: 4 }} />
                        {social.data}
                      </a>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            {/* Products */}
            {currentRecord.products.length > 0 && (
              <>
                <Divider orientation="right">محصولات</Divider>
                <Table
                  columns={productColumns}
                  dataSource={currentRecord.products}
                  rowKey={(_, index) => `product-${index}`}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CompanyServicePage;
