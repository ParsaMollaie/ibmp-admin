import { getCategoryTree } from '@/services/category';
import {
  getCompanies,
  getCompaniesForExport,
  getCompany,
  getCompanyStats,
  updateCompanyTag,
} from '@/services/company';
import { exportAllToExcel, ExportColumn } from '@/utils/exportExcel';
import {
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  StarOutlined,
  SwapOutlined,
  TagOutlined,
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
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import UpdateForm from './components/UpdateForm';
import UpdateStatusForm from './components/UpdateStatusForm';

const { Title, Text, Paragraph } = Typography;

// ============================================
// CONFIGURATION OBJECTS
// ============================================

/**
 * Helper function to get tag display configuration
 * Used in places where we need color-based Tag components
 *
 * Note: Since API may not always return 'tag' field, we default to 'عادی'
 * instead of 'نامشخص' when tag is undefined/null
 */
const getTagConfig = (
  tag: API.CompanyTag | undefined | null,
): { color: string; label: string } => {
  if (!tag) {
    return { color: 'default', label: 'عادی' };
  }

  const tagMap: Record<string, { color: string; label: string }> = {
    regular: { color: 'default', label: 'عادی' },
    most_view: { color: 'blue', label: 'پربازدید' },
    promoted: { color: 'green', label: 'ویژه' },
  };

  return tagMap[tag] || { color: 'default', label: tag };
};

const statusEnum: Record<string, { text: string; status: string }> = {
  pending: { text: 'در انتظار تایید', status: 'Warning' },
  approved: { text: 'تایید شده', status: 'Success' },
  rejected: { text: 'رد شده', status: 'Error' },
  disable: { text: 'غیرفعال', status: 'Default' },
};

const getStatusColor = (status: API.CompanyStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    disable: 'default',
  };
  return colorMap[status] || 'default';
};

const getStatusLabel = (status: API.CompanyStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    disable: 'غیرفعال',
  };
  return labelMap[status] || status;
};

// Helper function to get contact type label
const getContactTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    phone: 'تلفن',
    mobile: 'موبایل',
  };
  return typeMap[type] || type;
};

// Helper function to get social media type label
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

// Export column definitions with Persian headers
const exportColumns: ExportColumn[] = [
  { title: 'کد', dataIndex: 'code' },
  { title: 'نام شرکت', dataIndex: 'name' },
  { title: 'استان', dataIndex: ['province', 'name'] },
  { title: 'شهر', dataIndex: ['city', 'name'] },
  { title: 'ایمیل', dataIndex: 'email' },
  { title: 'خلاصه', dataIndex: 'summary' },
  {
    title: 'تگ',
    dataIndex: 'tag',
    render: (value) => {
      const tagMap: Record<string, string> = {
        regular: 'عادی',
        most_view: 'پربازدید',
        promoted: 'ویژه',
      };
      return tagMap[value] || 'عادی';
    },
  },
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
];

const CompanyPage: React.FC = () => {
  // ============================================
  // STATE & REFS
  // ============================================

  /**
   * ActionType ref gives us programmatic control over ProTable
   * We can call actionRef.current?.reload() to refresh data,
   * actionRef.current?.reset() to reset filters, etc.
   */
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Category tree for Cascader
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  // Tag stats
  const [tagStats, setTagStats] = useState<API.CompanyStats>({
    regular: 0,
    most_view: 0,
    promoted: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Modal visibility states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Currently selected record for modals
  const [currentRecord, setCurrentRecord] = useState<API.CompanyItem | null>(
    null,
  );

  // Detail modal loading state
  const [detailLoading, setDetailLoading] = useState(false);

  // Export states
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const fetchTagStats = async () => {
    setStatsLoading(true);
    try {
      const response = await getCompanyStats();
      if (response.success && response.data) {
        setTagStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tag stats:', error);
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
    fetchTagStats();
    fetchCategoryTree();

    // Read URL query params and apply as filters
    const params = new URLSearchParams(history.location.search);
    const name = params.get('name');
    if (name) {
      setTimeout(() => {
        formRef.current?.setFieldsValue({ name });
        formRef.current?.submit();
      }, 0);
    }
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
        getCompaniesForExport,
        filterParams,
        exportColumns,
        'companies',
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

  // Open company edit modal (full edit)
  const handleEdit = (record: API.CompanyItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Open detail view modal - fetch full data from view endpoint
  const handleViewDetail = async (record: API.CompanyItem) => {
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const response = await getCompany(record.id);
      if (response.success && response.data) {
        setCurrentRecord(response.data);
      } else {
        setCurrentRecord(record);
      }
    } catch {
      setCurrentRecord(record);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle successful update - reload table data
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchTagStats();
  };

  // Open status change modal
  const handleChangeStatus = (record: API.CompanyItem) => {
    setCurrentRecord(record);
    setStatusModalVisible(true);
  };

  // Handle successful status update
  const handleStatusUpdateSuccess = () => {
    setStatusModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchTagStats();
  };

  // Handle flag actions
  const handleSetRegular = async (record: API.CompanyItem) => {
    try {
      const response = await updateCompanyTag(record.id, 'regular');
      if (response.success) {
        message.success('شرکت با موفقیت به حالت عادی تغییر یافت');
        actionRef.current?.reload();
        fetchTagStats();
      }
    } catch (error) {
      message.error('خطا در تغییر وضعیت شرکت');
    }
  };

  const handleSetMostView = async (record: API.CompanyItem) => {
    try {
      const response = await updateCompanyTag(record.id, 'most_view');
      if (response.success) {
        message.success('شرکت با موفقیت به حالت پربازدید تغییر یافت');
        actionRef.current?.reload();
        fetchTagStats();
      }
    } catch (error) {
      message.error('خطا در تغییر وضعیت شرکت');
    }
  };

  const handleSetPromote = async (record: API.CompanyItem) => {
    try {
      const response = await updateCompanyTag(record.id, 'promoted');
      if (response.success) {
        message.success('شرکت با موفقیت به حالت ویژه تغییر یافت');
        actionRef.current?.reload();
        fetchTagStats();
      }
    } catch (error) {
      message.error('خطا در تغییر وضعیت شرکت');
    }
  };

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================

  /**
   * ProColumns extends the basic ColumnsType with additional properties:
   * - valueType: Determines how the column renders and filters (text, select, date, etc.)
   * - valueEnum: Provides options for select-type filters
   * - hideInSearch: Whether to show this column in the search form
   * - hideInTable: Whether to show this column in the table
   * - fieldProps: Props passed to the filter input component
   */
  const columns: ProColumns<API.CompanyItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      // Don't show code in search form - not a useful filter
      hideInSearch: true,
    },
    {
      title: 'لوگو',
      dataIndex: 'logo',
      key: 'logo',
      width: 80,
      // Images shouldn't be searchable
      hideInSearch: true,
      render: (_, record) =>
        record.logo ? (
          <Image
            src={record.logo}
            alt="logo"
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'نام شرکت',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      // This column IS searchable - ProTable will auto-generate a text input
      ellipsis: true,
      // Custom field props for the search input
      fieldProps: {
        placeholder: 'نام شرکت را وارد کنید',
      },
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
      title: 'استان',
      dataIndex: ['province', 'name'],
      key: 'province',
      width: 120,
      // Hide in search for now since we don't have province filter in API
      hideInSearch: true,
    },
    {
      title: 'شهر',
      dataIndex: ['city', 'name'],
      key: 'city',
      width: 120,
      hideInSearch: true,
    },
    {
      title: 'خلاصه',
      dataIndex: 'summary',
      key: 'summary',
      width: 250,
      ellipsis: true,
      // Summary is too long to be a useful search filter
      hideInSearch: true,
    },
    {
      title: 'تگ',
      dataIndex: 'tag',
      key: 'tag',
      width: 100,
      valueType: 'select',
      valueEnum: {
        regular: { text: 'عادی', status: 'Default' },
        most_view: { text: 'پربازدید', status: 'Processing' },
        promoted: { text: 'ویژه', status: 'Success' },
      },
      render: (_, record) => {
        const config = getTagConfig(record.tag);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      fieldProps: {
        placeholder: 'انتخاب تگ',
      },
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
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) =>
        record.status ? (
          <Tag color={getStatusColor(record.status)}>
            {getStatusLabel(record.status)}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 180,
      // Actions column shouldn't be in search form
      hideInSearch: true,
      // Fixed position keeps actions visible when scrolling horizontally
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            title="مشاهده جزئیات"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="ویرایش شرکت"
          />
          <Tooltip title="تغییر وضعیت">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={() => handleChangeStatus(record)}
            />
          </Tooltip>
          {/* Show icon for can_set_regular */}
          {record.can_set_regular && (
            <Tooltip title="تنظیم به عادی">
              <Button
                type="text"
                icon={<TagOutlined />}
                onClick={() => handleSetRegular(record)}
                style={{ color: '#8c8c8c' }}
              />
            </Tooltip>
          )}

          {/* Show icon for can_set_mot_view */}
          {record.can_set_most_view && (
            <Tooltip title="تنظیم به پربازدید">
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                onClick={() => handleSetMostView(record)}
              />
            </Tooltip>
          )}

          {/* Show icon for can_set_promote */}
          {record.can_set_promote && (
            <Tooltip title="تنظیم به ویژه">
              <Button
                type="text"
                icon={<StarOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleSetPromote(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  const handleTagCardClick = (tag: API.CompanyTag) => {
    formRef.current?.setFieldsValue({ tag });
    formRef.current?.submit();
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleTagCardClick('regular')}
            style={{ borderTop: '3px solid #d9d9d9' }}
          >
            <Statistic
              title="عادی"
              value={tagStats.regular}
              loading={statsLoading}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleTagCardClick('most_view')}
            style={{ borderTop: '3px solid #1890ff' }}
          >
            <Statistic
              title="پربازدید"
              value={tagStats.most_view}
              loading={statsLoading}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleTagCardClick('promoted')}
            style={{ borderTop: '3px solid #52c41a' }}
          >
            <Statistic
              title="ویژه"
              value={tagStats.promoted}
              loading={statsLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable<API.CompanyItem>
        // Table header text
        headerTitle="مدیریت شرکت‌ها"
        // Ref for programmatic control (reload, reset, etc.)
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        /**
         * Column definitions with ProColumns features
         */
        columns={columns}
        /**
         * The request function is called whenever:
         * 1. Table first loads
         * 2. User changes filters/search
         * 3. User changes pagination
         * 4. actionRef.current.reload() is called
         *
         * It receives params containing:
         * - All filter values from the search form
         * - current: current page number
         * - pageSize: items per page
         *
         * Must return { data, success, total } format
         */
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

          // Map ProTable params to our API params
          const response = await getCompanies({
            name: params.name,
            tag: params.tag,
            status: params.status,
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
        /**
         * Pagination configuration
         */
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `نمایش ${range[0]}-${range[1]} از ${total} شرکت`,
        }}
        /**
         * Search form configuration
         * This controls the filter form above the table
         */
        search={{
          // Position filters in a horizontal layout
          layout: 'horizontal',
          // Default collapsed state (false = expanded)
          defaultCollapsed: false,
          // Custom button text
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          // Label width for form items
          labelWidth: 'auto',
        }}
        /**
         * Toolbar options - the icons/buttons in the top-right corner
         */
        options={{
          // Show the density toggle (comfortable/middle/compact)
          density: true,
          // Show the fullscreen toggle
          fullScreen: true,
          // Show the reload button
          reload: true,
          // Show the column settings (show/hide columns)
          setting: {
            listsHeight: 400,
          },
        }}
        /**
         * Enable horizontal scroll when content overflows
         */
        scroll={{ x: 1100 }}
        /**
         * Date formatting for any date columns
         * Using Jalali format for Persian dates
         */
        dateFormatter="string"
        /**
         * Card-style wrapper with border
         */
        cardBordered
      />

      {/* Full Company Edit Modal */}
      <UpdateForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleUpdateSuccess}
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
        title="جزئیات شرکت"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={800}
      >
        <Spin spinning={detailLoading}>
          {currentRecord && (
            <div>
              {/* Company Header with Logo */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 24,
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                {currentRecord.logo && (
                  <Image
                    src={currentRecord.logo}
                    alt={currentRecord.name}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {currentRecord.name}
                  </Title>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={getTagConfig(currentRecord.tag).color}>
                      {getTagConfig(currentRecord.tag).label}
                    </Tag>
                    <Text type="secondary">کد: {currentRecord.code}</Text>
                  </Space>
                </div>
              </div>

              {/* Basic Information */}
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="استان">
                  {currentRecord.province?.name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="شهر">
                  {currentRecord.city?.name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="آدرس" span={2}>
                  {currentRecord.address || '—'}
                </Descriptions.Item>
              </Descriptions>

              {/* Summary */}
              <Divider orientation="right">خلاصه</Divider>
              <Paragraph>{currentRecord.summary || '—'}</Paragraph>

              {/* Description */}
              {currentRecord.description && (
                <>
                  <Divider orientation="right">توضیحات</Divider>
                  <Paragraph>{currentRecord.description}</Paragraph>
                </>
              )}

              {/* Contact Numbers */}
              {currentRecord.contact_numbers &&
                currentRecord.contact_numbers.length > 0 && (
                  <>
                    <Divider orientation="right">شماره‌های تماس</Divider>
                    <Descriptions bordered column={2} size="small">
                      {currentRecord.contact_numbers.map((contact, index) => (
                        <Descriptions.Item
                          key={index}
                          label={getContactTypeLabel(contact.type)}
                        >
                          <span
                            style={{
                              direction: 'ltr',
                              display: 'inline-block',
                            }}
                          >
                            {contact.data}
                          </span>
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </>
                )}

              {/* Social Media */}
              {currentRecord.social_media &&
                currentRecord.social_media.length > 0 && (
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
                            style={{
                              direction: 'ltr',
                              display: 'inline-block',
                            }}
                          >
                            <LinkOutlined style={{ marginLeft: 4 }} />
                            {social.data}
                          </a>
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </>
                )}

              {/* Catalog Link */}
              {currentRecord.catalog && (
                <>
                  <Divider orientation="right">کاتالوگ</Divider>
                  <a
                    href={currentRecord.catalog}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button icon={<LinkOutlined />}>دانلود کاتالوگ</Button>
                  </a>
                </>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default CompanyPage;
