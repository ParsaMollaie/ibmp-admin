import { getCategoryTree } from '@/services/category';
import {
  approveService,
  getServices,
  getServicesForExport,
  getServiceStats,
  rejectService,
  updateServiceTag,
} from '@/services/service';
import { collectLeafCategories } from '@/utils/categoryHelpers';
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
  StarOutlined,
  SwapOutlined,
  TagOutlined,
  UploadOutlined,
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
import { saveAs } from 'file-saver';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import * as XLSX from 'xlsx';
import BulkCategoryUpdateModal from './components/BulkCategoryUpdateModal';
import UpdateCategoryForm from './components/UpdateCategoryForm';
import UpdateForm from './components/UpdateForm';
import UpdateStatusForm from './components/UpdateStatusForm';

const { Title, Text, Paragraph } = Typography;

// ============================================
// CONFIGURATION
// ============================================

const statusEnum: Record<string, { text: string; status: string }> = {
  pending: { text: 'در انتظار تایید', status: 'Warning' },
  approved: { text: 'تایید شده', status: 'Success' },
  rejected: { text: 'رد شده', status: 'Error' },
  disable: { text: 'غیرفعال', status: 'Default' },
};

const promotionTypeEnum: Record<string, { text: string; status: string }> = {
  regular: { text: 'عادی', status: 'Default' },
  promoted: { text: 'ویژه', status: 'Processing' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getStatusColor = (status: API.ServiceStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    disable: 'default',
  };
  return colorMap[status] || 'default';
};

const getStatusLabel = (status: API.ServiceStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    disable: 'غیرفعال',
  };
  return labelMap[status] || status;
};

const getPromotionTypeColor = (type: API.ServicePromotionType): string => {
  const colorMap: Record<string, string> = {
    regular: 'default',
    promoted: 'blue',
  };
  return colorMap[type] || 'default';
};

const getPromotionTypeLabel = (type: API.ServicePromotionType): string => {
  const labelMap: Record<string, string> = {
    regular: 'عادی',
    promoted: 'ویژه',
  };
  return labelMap[type] || type;
};

const getTagConfig = (
  tag: API.ServiceTag | undefined | null,
): { color: string; label: string } => {
  if (!tag) return { color: 'default', label: 'عادی' };
  const tagMap: Record<string, { color: string; label: string }> = {
    regular: { color: 'default', label: 'عادی' },
    most_view: { color: 'blue', label: 'پربازدید' },
    promoted: { color: 'green', label: 'ویژه' },
  };
  return tagMap[tag] || { color: 'default', label: tag };
};

const getContactTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    phone: 'تلفن',
    mobile: 'موبایل',
  };
  return typeMap[type] || type;
};

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
 * Build full category path from child chain (root → child → child)
 */
const buildCategoryPath = (category: API.ServiceCategory | null): string => {
  if (!category) return '—';
  const parts: string[] = [category.title];

  let current: API.ServiceCategoryChild | null = category.child;
  while (current) {
    parts.push(current.title);
    current = current.child;
  }

  return parts.join(' > ');
};

/**
 * Get the leaf (deepest) category title
 */
const getLeafCategoryTitle = (category: API.ServiceCategory | null): string => {
  if (!category) return '—';
  let title = category.title;
  let current: API.ServiceCategoryChild | null = category.child;
  while (current) {
    title = current.title;
    current = current.child;
  }
  return title;
};

const formatPrice = (price: number): string => {
  if (price === 0) return 'رایگان';
  return `${price.toLocaleString('fa-IR')} تومان`;
};

// Export column definitions
const exportColumns: ExportColumn[] = [
  { title: 'کد', dataIndex: 'code' },
  { title: 'عنوان', dataIndex: 'title' },
  {
    title: 'دسته‌بندی',
    dataIndex: 'category',
    render: (_, record) => getLeafCategoryTitle(record.category),
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
  {
    title: 'نوع ارتقا',
    dataIndex: 'promotion_type',
    render: (value) => {
      const typeMap: Record<string, string> = {
        regular: 'عادی',
        promoted: 'ویژه',
      };
      return typeMap[value] || value;
    },
  },
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
  { title: 'اولویت', dataIndex: 'priority' },
];

const ServiceCompanyPage: React.FC = () => {
  // ============================================
  // REFS & STATE
  // ============================================

  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();

  // Status stats
  const [statusStats, setStatusStats] = useState<API.ServiceStatusStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    disable: 0,
  });
  const [statusStatsLoading, setStatusStatsLoading] = useState(false);

  // Tag stats
  const [tagStats, setTagStats] = useState<API.ServiceTagStats>({
    regular: 0,
    most_view: 0,
    promoted: 0,
  });
  const [tagStatsLoading, setTagStatsLoading] = useState(false);

  // Category tree for Cascader
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  const fetchStats = async () => {
    setStatusStatsLoading(true);
    setTagStatsLoading(true);
    try {
      const response = await getServiceStats('company');
      if (response.success && response.data) {
        setStatusStats(response.data.status);
        setTagStats(response.data.tag);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatusStatsLoading(false);
      setTagStatsLoading(false);
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
    fetchStats();
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
  const [currentRecord, setCurrentRecord] = useState<API.ServiceItem | null>(
    null,
  );

  // Export states
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);

  // Bulk category update
  const [categoryExporting, setCategoryExporting] = useState(false);
  const [bulkCategoryModalVisible, setBulkCategoryModalVisible] =
    useState(false);

  // ============================================
  // EVENT HANDLERS
  // ============================================

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
        (params) => getServicesForExport({ ...params, type: 'company' }),
        filterParams,
        exportColumns,
        'services-company',
        500,
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

  const handleCategoryExport = async () => {
    setCategoryExporting(true);
    const messageKey = 'category-export-progress';
    message.loading({
      content: 'در حال دانلود...',
      key: messageKey,
      duration: 0,
    });

    try {
      const allData: any[] = [];
      let page = 1;
      let total = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await getServicesForExport({
          ...filterParams,
          type: 'company',
          page,
          page_size: 500,
        });

        if (!response.success || !response.data?.list) {
          if (allData.length === 0) {
            message.warning({
              content: 'داده‌ای برای دانلود وجود ندارد',
              key: messageKey,
            });
            setCategoryExporting(false);
            return;
          }
          break;
        }

        const { list, pagination } = response.data;
        total = pagination.total;
        allData.push(...list);

        message.loading({
          content: `در حال دانلود... ${allData.length} از ${total}`,
          key: messageKey,
          duration: 0,
        });

        hasMore = allData.length < total && list.length === 500;
        page++;
      }

      // Sheet 1: Services data
      const sheet1Data = allData.map((record: API.ServiceItem) => ({
        شناسه: record.id,
        کد: record.code,
        عنوان: record.title,
        'دسته‌بندی فعلی': getLeafCategoryTitle(record.category),
        'دسته‌بندی جدید': '',
      }));

      // Sheet 2: Leaf categories reference
      const leaves = collectLeafCategories(categoryTree);
      const sheet2Data = leaves.map((leaf) => ({
        'نام دسته‌بندی': leaf.title,
        'مسیر کامل': leaf.path,
      }));

      const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
      ws1['!cols'] = [
        { wch: 38 },
        { wch: 10 },
        { wch: 30 },
        { wch: 25 },
        { wch: 25 },
      ];

      const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
      ws2['!cols'] = [{ wch: 30 }, { wch: 50 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws1, 'خدمات');
      XLSX.utils.book_append_sheet(workbook, ws2, 'دسته‌بندی‌ها');

      const timestamp = new Date().toISOString().slice(0, 10);
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `services-company-categories_${timestamp}.xlsx`);

      message.success({
        content: `${allData.length} رکورد با موفقیت دانلود شد`,
        key: messageKey,
      });
    } catch (error) {
      message.error({
        content: 'خطا در دانلود فایل اکسل',
        key: messageKey,
      });
    } finally {
      setCategoryExporting(false);
    }
  };

  const handleEdit = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleViewDetail = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  const handleUpdateCategory = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setUpdateCategoryModalVisible(true);
  };

  const handleUpdateCategorySuccess = () => {
    setUpdateCategoryModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  const handleChangeStatus = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setStatusModalVisible(true);
  };

  const handleStatusUpdateSuccess = () => {
    setStatusModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchStats();
  };

  const handleApprove = (record: API.ServiceItem) => {
    Modal.confirm({
      title: 'تایید خدمت',
      content: `آیا از تایید خدمت "${record.title}" اطمینان دارید؟`,
      okText: 'بله، تایید شود',
      cancelText: 'انصراف',
      okType: 'primary',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await approveService(record.id);
          if (response.success) {
            message.success('خدمت با موفقیت تایید شد');
            actionRef.current?.reload();
            fetchStats();
          } else {
            message.error(response.message || 'خطا در تایید خدمت');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleReject = (record: API.ServiceItem) => {
    Modal.confirm({
      title: 'رد خدمت',
      content: `آیا از رد خدمت "${record.title}" اطمینان دارید؟`,
      okText: 'بله، رد شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await rejectService(record.id);
          if (response.success) {
            message.success('خدمت با موفقیت رد شد');
            actionRef.current?.reload();
            fetchStats();
          } else {
            message.error(response.message || 'خطا در رد خدمت');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Tag actions
  const handleSetRegular = async (record: API.ServiceItem) => {
    try {
      const response = await updateServiceTag(record.id, 'regular');
      if (response.success) {
        message.success('خدمت با موفقیت به حالت عادی تغییر یافت');
        actionRef.current?.reload();
        fetchStats();
      }
    } catch (error) {
      message.error('خطا در تغییر تگ خدمت');
    }
  };

  const handleSetMostView = async (record: API.ServiceItem) => {
    try {
      const response = await updateServiceTag(record.id, 'most_view');
      if (response.success) {
        message.success('خدمت با موفقیت به حالت پربازدید تغییر یافت');
        actionRef.current?.reload();
        fetchStats();
      }
    } catch (error) {
      message.error('خطا در تغییر تگ خدمت');
    }
  };

  const handleSetPromoted = async (record: API.ServiceItem) => {
    try {
      const response = await updateServiceTag(record.id, 'promoted');
      if (response.success) {
        message.success('خدمت با موفقیت به حالت ویژه تغییر یافت');
        actionRef.current?.reload();
        fetchStats();
      }
    } catch (error) {
      message.error('خطا در تغییر تگ خدمت');
    }
  };

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.ServiceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'جستجو',
      dataIndex: 'search',
      key: 'search',
      hideInTable: true,
      fieldProps: {
        placeholder: 'جستجو در عنوان و دسته‌بندی',
      },
    },
    {
      title: 'عنوان خدمت',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'لوگو',
      key: 'logo',
      width: 70,
      hideInSearch: true,
      render: (_, record) =>
        record.company?.logo ? (
          <Image
            src={record.company.logo}
            alt="logo"
            width={24}
            height={24}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
          />
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'دسته‌بندی',
      key: 'category_display',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={buildCategoryPath(record.category)}>
          <span>{getLeafCategoryTitle(record.category)}</span>
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
      title: 'نوع ارتقا',
      dataIndex: 'promotion_type',
      key: 'promotion_type',
      width: 100,
      valueType: 'select',
      valueEnum: promotionTypeEnum,
      render: (_, record) => (
        <Tag color={getPromotionTypeColor(record.promotion_type)}>
          {getPromotionTypeLabel(record.promotion_type)}
        </Tag>
      ),
      fieldProps: {
        placeholder: 'انتخاب نوع',
      },
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
      width: 220,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.can_approve && (
            <Tooltip title="تایید خدمت">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleApprove(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          {record.can_reject && (
            <Tooltip title="رد خدمت">
              <Button
                type="text"
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                onClick={() => handleReject(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          <Tooltip title="تغییر وضعیت">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={() => handleChangeStatus(record)}
            />
          </Tooltip>

          <Tooltip title="مشاهده جزئیات">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>

          <Tooltip title="تغییر دسته‌بندی">
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={() => handleUpdateCategory(record)}
            />
          </Tooltip>

          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          {/* Tag actions */}
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

          {record.can_set_most_view && (
            <Tooltip title="تنظیم به پربازدید">
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                onClick={() => handleSetMostView(record)}
              />
            </Tooltip>
          )}

          {record.can_set_promoted && (
            <Tooltip title="تنظیم به ویژه">
              <Button
                type="text"
                icon={<StarOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleSetPromoted(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Products table columns for detail modal
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

  const handleStatusCardClick = (status: API.ServiceStatus) => {
    formRef.current?.setFieldsValue({ status });
    formRef.current?.submit();
  };

  const handleTagCardClick = (tag: API.ServiceTag) => {
    formRef.current?.setFieldsValue({ tag });
    formRef.current?.submit();
  };

  return (
    <>
      {/* Status Stat Cards */}
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
              loading={statusStatsLoading}
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
              loading={statusStatsLoading}
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
              loading={statusStatsLoading}
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
              loading={statusStatsLoading}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tag Stat Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => handleTagCardClick('regular')}
            style={{ borderTop: '3px solid #d9d9d9' }}
          >
            <Statistic
              title="تگ: عادی"
              value={tagStats.regular}
              loading={tagStatsLoading}
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
              title="تگ: پربازدید"
              value={tagStats.most_view}
              loading={tagStatsLoading}
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
              title="تگ: ویژه"
              value={tagStats.promoted}
              loading={tagStatsLoading}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable<API.ServiceItem>
        headerTitle="مدیریت خدمات شرکت‌ها"
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
          <Button
            key="category-export"
            icon={<DownloadOutlined />}
            onClick={handleCategoryExport}
            loading={categoryExporting}
          >
            خروجی دسته‌بندی
          </Button>,
          <Button
            key="category-upload"
            icon={<UploadOutlined />}
            onClick={() => setBulkCategoryModalVisible(true)}
          >
            بارگذاری دسته‌بندی
          </Button>,
        ]}
        request={async (params) => {
          const categoryCodeArr = params.category_code;
          const categoryCode =
            Array.isArray(categoryCodeArr) && categoryCodeArr.length > 0
              ? categoryCodeArr[categoryCodeArr.length - 1]
              : undefined;

          const apiParams = {
            search: params.search,
            status: params.status,
            promotion_type: params.promotion_type,
            tag: params.tag,
            user_search: params.user_search,
            category_code: categoryCode,
            type: 'company' as const,
          };

          setFilterParams(apiParams);

          const response = await getServices({
            ...apiParams,
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
            `نمایش ${range[0]}-${range[1]} از ${total} خدمت`,
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
        scroll={{ x: 1400 }}
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

      {/* Bulk Category Update Modal */}
      <BulkCategoryUpdateModal
        visible={bulkCategoryModalVisible}
        onCancel={() => setBulkCategoryModalVisible(false)}
        onSuccess={() => {
          setBulkCategoryModalVisible(false);
          actionRef.current?.reload();
        }}
        categoryTree={categoryTree}
      />

      {/* Detail View Modal */}
      <Modal
        title="جزئیات خدمت"
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
                  <Space style={{ marginTop: 8 }} wrap>
                    <Tag color={getStatusColor(currentRecord.status)}>
                      {getStatusLabel(currentRecord.status)}
                    </Tag>
                    <Tag
                      color={getPromotionTypeColor(
                        currentRecord.promotion_type,
                      )}
                    >
                      {getPromotionTypeLabel(currentRecord.promotion_type)}
                    </Tag>
                    {(() => {
                      const tagConfig = getTagConfig(currentRecord.tag);
                      return (
                        <Tag color={tagConfig.color}>{tagConfig.label}</Tag>
                      );
                    })()}
                    <Text type="secondary">کد: {currentRecord.code}</Text>
                    <Text type="secondary">
                      اولویت: {currentRecord.priority}
                    </Text>
                  </Space>
                </div>
                {currentRecord.company?.logo && (
                  <Image
                    src={currentRecord.company.logo}
                    alt="logo"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
              </div>
            </Card>

            {/* Summary */}
            {currentRecord.summary && (
              <>
                <Divider orientation="right">خلاصه</Divider>
                <Paragraph>{currentRecord.summary}</Paragraph>
              </>
            )}

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

            {/* Location & Company Info */}
            <Divider orientation="right">اطلاعات مکانی</Divider>
            <Descriptions bordered column={2} size="small">
              {currentRecord.province && (
                <Descriptions.Item label="استان">
                  {currentRecord.province.name}
                </Descriptions.Item>
              )}
              {currentRecord.city && (
                <Descriptions.Item label="شهرستان">
                  {currentRecord.city.name}
                </Descriptions.Item>
              )}
              {currentRecord.company?.address && (
                <Descriptions.Item label="آدرس" span={2}>
                  {currentRecord.company.address}
                </Descriptions.Item>
              )}
              {currentRecord.email && (
                <Descriptions.Item label="ایمیل">
                  <span style={{ direction: 'ltr', display: 'inline-block' }}>
                    {currentRecord.email}
                  </span>
                </Descriptions.Item>
              )}
              {currentRecord.company?.catalog && (
                <Descriptions.Item label="کاتالوگ">
                  <a
                    href={currentRecord.company.catalog}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkOutlined style={{ marginLeft: 4 }} />
                    دانلود کاتالوگ
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Contact Numbers */}
            {currentRecord.contact_numbers.length > 0 && (
              <>
                <Divider orientation="right">شماره‌های تماس</Divider>
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

export default ServiceCompanyPage;
