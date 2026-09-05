import { getSocialTypeLabel } from '@/constants/serviceSocialMedia';
import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getCategoryTree } from '@/services/category';
import { getPlans } from '@/services/plan';
import {
  approveService,
  approveServiceRevision,
  getServices,
  getServicesForExport,
  getServiceStats,
  rejectService,
  rejectServiceRevision,
  updateServiceTag,
} from '@/services/service';
import {
  createServiceNote,
  deleteServiceNote,
  getServiceNotes,
} from '@/services/service-notes';
import { exportAllToExcel, ExportColumn } from '@/utils/exportExcel';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CrownOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  LinkOutlined,
  LockOutlined,
  MoreOutlined,
  OrderedListOutlined,
  ShoppingOutlined,
  StarOutlined,
  SwapOutlined,
  TagOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { MenuProps } from 'antd';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Dropdown,
  Image,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
} from 'antd';
import { DatePicker } from 'antd-jalali';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import AssignPlanForm from './components/AssignPlanForm';
import ProductsManagementModal from './components/ProductsManagementModal';
import UpdateCategoryForm from './components/UpdateCategoryForm';
import UpdateFormCompany from './components/UpdateFormCompany';
import UpdateFormEngineers from './components/UpdateFormEngineers';
import UpdatePriorityForm from './components/UpdatePriorityForm';
import UpdateStatusForm from './components/UpdateStatusForm';
import WorkSamplesManagementModal from './components/WorkSamplesManagementModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

const typeEnum: Record<string, { text: string }> = {
  company: { text: 'شرکت' },
  engineers: { text: 'مهندس/مجری' },
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

const getTypeLabel = (type: API.ServiceType): string => {
  const labelMap: Record<string, string> = {
    company: 'شرکت',
    engineers: 'مهندس/مجری',
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

/**
 * Build full category path from the leaf-first parent chain the API returns
 * ({title, parent: {title, parent: {title: root}}}), reversed to read
 * root → leaf.
 */
const buildCategoryPath = (category: API.ServiceCategory | null): string => {
  if (!category) return '—';
  const parts: string[] = [category.title];

  let current: API.ServiceCategoryChild | null = category.parent;
  while (current) {
    parts.push(current.title);
    current = current.parent;
  }

  return parts.reverse().join(' > ');
};

/**
 * Get the leaf category title — the given category is already the leaf,
 * no traversal needed.
 */
const getLeafCategoryTitle = (category: API.ServiceCategory | null): string => {
  if (!category) return '—';
  return category.title;
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
    title: 'نوع',
    dataIndex: 'type',
    render: (value) => getTypeLabel(value),
  },
  {
    title: 'دسته‌بندی',
    dataIndex: 'category',
    render: (_, record) => buildCategoryPath(record.category),
  },
  {
    title: 'استان',
    dataIndex: 'addresses',
    render: (_, record) =>
      record.addresses
        ?.map((a) => a.province?.name)
        .filter(Boolean)
        .join('، ') || '—',
  },
  {
    title: 'شهر',
    dataIndex: 'addresses',
    render: (_, record) =>
      record.addresses
        ?.map((a) => a.city?.name)
        .filter(Boolean)
        .join('، ') || '—',
  },
  {
    title: 'آدرس',
    dataIndex: 'addresses',
    render: (_, record) =>
      record.addresses?.length > 0
        ? record.addresses
            .map((a: API.ServiceAddress) => a.address)
            .filter(Boolean)
            .join(' | ')
        : '—',
  },
  {
    title: 'پروفایل تماس',
    dataIndex: 'contact_profile_title',
    render: (_, record) => record.contact_profile_title || '—',
  },
  {
    title: 'تلفن‌ها',
    dataIndex: 'contact_numbers',
    render: (_, record) =>
      record.contact_numbers?.length > 0
        ? record.contact_numbers
            .map((c: API.ServiceContactNumber) => c.data)
            .join('، ')
        : '—',
  },
  {
    title: 'آدرس شرکت',
    dataIndex: 'company',
    render: (_, record) =>
      record.type === 'company' ? record.company?.address || '—' : '',
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

// Products table columns for the detail modal (company services)
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

const ServicesPage: React.FC = () => {
  // ============================================
  // REFS & STATE
  // ============================================

  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();
  const [pageSize, setPageSize] = usePersistedPageSize('services', 10);

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

  // Pending-revision stat (services with an update awaiting admin approval)
  const [pendingRevisionCount, setPendingRevisionCount] = useState(0);
  const [pendingRevisionStatsLoading, setPendingRevisionStatsLoading] =
    useState(false);
  // Drives the table's request via ProTable's `params` prop (not the search
  // form) so the filter reliably triggers a refetch regardless of the search
  // form's field-registration timing.
  const [pendingRevisionQuickFilter, setPendingRevisionQuickFilter] =
    useState(false);

  // Category tree for the category filter
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  // Plans list for filter
  const [plansList, setPlansList] = useState<API.PlanItem[]>([]);

  const fetchStats = async () => {
    setStatusStatsLoading(true);
    setTagStatsLoading(true);
    setPendingRevisionStatsLoading(true);
    try {
      const response = await getServiceStats();
      if (response.success && response.data) {
        setStatusStats(response.data.status);
        setTagStats(response.data.tag);
        setPendingRevisionCount(response.data.pending_revision_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatusStatsLoading(false);
      setTagStatsLoading(false);
      setPendingRevisionStatsLoading(false);
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

  useEffect(() => {
    fetchStats();
    fetchCategoryTree();
    fetchPlans();

    // Read search query param from URL (e.g. navigated from complaints page)
    const params = new URLSearchParams(history.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      formRef.current?.setFieldsValue({ search: searchParam });
      formRef.current?.submit();
    }
  }, []);

  // Dashboard charts link here with query params (e.g. ?tag=most_view, ?status=approved,
  // ?type=engineers) to pre-filter the list — read them once as the ProTable form's
  // initial values.
  const urlParams = new URLSearchParams(history.location.search);
  const initialValues = {
    type: urlParams.get('type') || undefined,
    status: urlParams.get('status') || undefined,
    tag: urlParams.get('tag') || undefined,
  };

  const buildTreeSelectOptions = (
    items: API.CategoryTreeItem[],
  ): { title: string; value: string; key: string; children?: any[] }[] => {
    return items.map((item) => ({
      title: item.title,
      value: String(item.code),
      key: String(item.code),
      children:
        item.children && item.children.length > 0
          ? buildTreeSelectOptions(item.children)
          : undefined,
    }));
  };

  // Modal visibility states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateCategoryModalVisible, setUpdateCategoryModalVisible] =
    useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [assignPlanModalVisible, setAssignPlanModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Products management modal state
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [productsRecord, setProductsRecord] = useState<API.ServiceItem | null>(
    null,
  );

  // Work samples management modal state
  const [workSamplesModalVisible, setWorkSamplesModalVisible] = useState(false);
  const [workSamplesRecord, setWorkSamplesRecord] =
    useState<API.ServiceItem | null>(null);

  // Notes modal state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesRecord, setNotesRecord] = useState<API.ServiceItem | null>(null);
  const [notes, setNotes] = useState<API.ServiceNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Currently selected record
  const [currentRecord, setCurrentRecord] = useState<API.ServiceItem | null>(
    null,
  );

  // Export states
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);

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
        (params) => getServicesForExport(params),
        filterParams,
        exportColumns,
        'services',
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

  const handleChangePriority = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setPriorityModalVisible(true);
  };

  const handlePriorityUpdateSuccess = () => {
    setPriorityModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  const handleManageProducts = (record: API.ServiceItem) => {
    setProductsRecord(record);
    setProductsModalVisible(true);
  };

  const handleManageWorkSamples = (record: API.ServiceItem) => {
    setWorkSamplesRecord(record);
    setWorkSamplesModalVisible(true);
  };

  // ============================================
  // NOTES HANDLERS
  // ============================================

  const fetchNotes = async (serviceId: string) => {
    setNotesLoading(true);
    try {
      const res = await getServiceNotes(serviceId);
      if (res.success) {
        setNotes(res.data || []);
      }
    } catch {
      message.error('خطا در دریافت یادداشت‌ها');
    } finally {
      setNotesLoading(false);
    }
  };

  const openNotesModal = async (record: API.ServiceItem) => {
    setNotesRecord(record);
    setNotesModalVisible(true);
    setNewNoteContent('');
    await fetchNotes(record.id);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !notesRecord) return;
    setSubmittingNote(true);
    try {
      const res = await createServiceNote(notesRecord.id, {
        content: newNoteContent.trim(),
      });
      if (res.success) {
        message.success('یادداشت اضافه شد');
        setNewNoteContent('');
        await fetchNotes(notesRecord.id);
        actionRef.current?.reload();
      }
    } catch {
      message.error('خطا در ایجاد یادداشت');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!notesRecord) return;
    try {
      const res = await deleteServiceNote(noteId);
      if (res.success) {
        message.success('یادداشت حذف شد');
        await fetchNotes(notesRecord.id);
        actionRef.current?.reload();
      }
    } catch {
      message.error('خطا در حذف یادداشت');
    }
  };

  const handleStatusUpdateSuccess = () => {
    setStatusModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
    fetchStats();
  };

  const handleAssignPlan = (record: API.ServiceItem) => {
    setCurrentRecord(record);
    setAssignPlanModalVisible(true);
  };

  const handleAssignPlanSuccess = () => {
    setAssignPlanModalVisible(false);
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

  const handleApproveRevision = (record: API.ServiceItem) => {
    Modal.confirm({
      title: 'تایید ویرایش',
      content: `آیا از تایید ویرایش در انتظار تایید خدمت "${record.title}" اطمینان دارید؟ تغییرات ثبت‌شده روی نسخه زنده اعمال می‌شود.`,
      okText: 'بله، ویرایش تایید شود',
      cancelText: 'انصراف',
      okType: 'primary',
      onOk: async () => {
        setActionLoading(`${record.id}-revision`);
        try {
          const response = await approveServiceRevision(record.id);
          if (response.success) {
            message.success('ویرایش با موفقیت تایید و اعمال شد');
            actionRef.current?.reload();
            fetchStats();
          } else {
            message.error(response.message || 'خطا در تایید ویرایش');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleRejectRevision = (record: API.ServiceItem) => {
    Modal.confirm({
      title: 'رد ویرایش',
      content: `آیا از رد ویرایش در انتظار تایید خدمت "${record.title}" اطمینان دارید؟ نسخه زنده بدون تغییر باقی می‌ماند.`,
      okText: 'بله، ویرایش رد شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(`${record.id}-revision`);
        try {
          const response = await rejectServiceRevision(record.id);
          if (response.success) {
            message.success('ویرایش با موفقیت رد شد');
            actionRef.current?.reload();
            fetchStats();
          } else {
            message.error(response.message || 'خطا در رد ویرایش');
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
      sorter: true,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      valueType: 'select',
      valueEnum: typeEnum,
      render: (_, record) => <Tag>{getTypeLabel(record.type)}</Tag>,
      fieldProps: {
        placeholder: 'انتخاب نوع',
      },
      sorter: true,
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
      dataIndex: 'category_codes',
      key: 'category_codes',
      hideInTable: true,
      renderFormItem: () => (
        <TreeSelect
          treeData={buildTreeSelectOptions(categoryTree)}
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_CHILD}
          showSearch
          treeNodeFilterProp="title"
          placeholder="انتخاب دسته‌بندی (چند انتخابی)"
          style={{ width: '100%' }}
          maxTagCount="responsive"
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
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() =>
              history.push(`/user?username=${record.user!.username}`)
            }
          >
            <div style={{ fontWeight: 500 }}>
              {record.user.first_name} {record.user.last_name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {record.user.username}
            </div>
            {record.user.job_position && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
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
      title: 'پلن',
      key: 'plan_display',
      width: 130,
      hideInSearch: true,
      render: (_, record) => {
        const order = record.latest_active_order;
        if (!order?.plan) {
          return <Tag color="default">بدون پلن</Tag>;
        }
        const isExpired =
          order.expires_at && new Date(order.expires_at) < new Date();
        return (
          <Tooltip
            title={
              order.expires_at
                ? `انقضا: ${new Date(order.expires_at).toLocaleDateString(
                    'fa-IR',
                  )}`
                : undefined
            }
          >
            <Tag icon={<CrownOutlined />} color={isExpired ? 'red' : 'gold'}>
              {order.plan.name}
            </Tag>
          </Tooltip>
        );
      },
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
            label: p.name,
          }))}
        />
      ),
    },
    {
      title: 'وضعیت پلن',
      dataIndex: 'has_active_plan',
      key: 'has_active_plan',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        yes: { text: 'دارای پلن فعال' },
        no: { text: 'بدون پلن' },
      },
      fieldProps: {
        placeholder: 'وضعیت پلن',
      },
    },
    {
      title: 'به‌روزرسانی در انتظار تایید',
      dataIndex: 'has_pending_revision',
      key: 'has_pending_revision',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        yes: { text: 'دارای به‌روزرسانی در انتظار تایید' },
        no: { text: 'بدون به‌روزرسانی در انتظار تایید' },
      },
      fieldProps: {
        placeholder: 'به‌روزرسانی در انتظار تایید',
      },
    },
    {
      title: 'انقضای پلن',
      dataIndex: 'plan_expires_at',
      key: 'plan_expires_at',
      width: 120,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        const expiresAt = record.latest_active_order?.expires_at;
        if (!expiresAt) {
          return <span style={{ color: '#999' }}>بدون پلن فعال</span>;
        }
        const daysRemaining = Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) / 86400000,
        );
        return (
          <Tag color={daysRemaining <= 7 ? 'red' : 'default'}>
            {daysRemaining} روز
          </Tag>
        );
      },
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'created_at',
      width: 150,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <span>{new Date(record.created_at).toLocaleString('fa-IR')}</span>
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      width: 150,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.updated_at) return '—';
        return new Date(record.updated_at).toLocaleString('fa-IR');
      },
      sorter: true,
    },
    {
      title: 'ایجاد شده توسط',
      key: 'created_by',
      dataIndex: 'created_by',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
      sorter: true,
    },
    {
      title: 'بروزرسانی شده توسط',
      key: 'updated_by',
      dataIndex: 'updated_by',
      width: 130,
      hideInSearch: true,
      sorter: true,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
    },
    {
      title: 'از تاریخ',
      dataIndex: 'created_from',
      key: 'created_from',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="از تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'created_to',
      key: 'created_to',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="تا تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'محصولات',
      dataIndex: 'products',
      key: 'products',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.type === 'company' ? (
          <Tag icon={<ShoppingOutlined />}>
            {record.products?.length || 0} محصول
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'نمونه کارها',
      dataIndex: 'work_samples',
      key: 'work_samples',
      width: 110,
      hideInSearch: true,
      render: (_, record) =>
        record.type === 'engineers' ? (
          <Tag icon={<FileImageOutlined />}>
            {record.work_samples?.length || 0} نمونه
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'استان',
      key: 'province',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        if (record.type !== 'engineers') return '—';
        const names = (record.addresses || [])
          .map((a) => a.province?.name)
          .filter(Boolean);
        if (names.length === 0) return '—';
        return names.length > 1 ? (
          <Tooltip title={names.join('، ')}>
            <span>
              {names[0]} (+{names.length - 1})
            </span>
          </Tooltip>
        ) : (
          <span>{names[0]}</span>
        );
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Tag color={getStatusColor(record.status)}>
            {getStatusLabel(record.status)}
          </Tag>
          {record.pending_revision && (
            <Tag color="gold">ویرایش در انتظار تایید</Tag>
          )}
        </Space>
      ),
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
      sorter: true,
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
      sorter: true,
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
      sorter: true,
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => (
        <Space size={4}>
          {record.priority}
          {record.priority_locked && (
            <Tooltip title="قفل است — توسط سامانه چرخش خودکار تغییر نمی‌کند">
              <LockOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 190,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => {
        const moreItems: MenuProps['items'] = [
          {
            key: 'status',
            icon: <SwapOutlined />,
            label: 'تغییر وضعیت',
            onClick: () => handleChangeStatus(record),
          },
          {
            key: 'category',
            icon: <AppstoreOutlined />,
            label: 'تغییر دسته‌بندی',
            onClick: () => handleUpdateCategory(record),
          },
          {
            key: 'plan',
            icon: <CrownOutlined />,
            label: 'تخصیص پلن',
            onClick: () => handleAssignPlan(record),
          },
          {
            key: 'priority',
            icon: <OrderedListOutlined />,
            label: 'تغییر اولویت',
            onClick: () => handleChangePriority(record),
          },
          {
            key: 'notes',
            icon: <FileTextOutlined />,
            label:
              (record.notes_count ?? 0) > 0
                ? `یادداشت‌ها (${record.notes_count})`
                : 'یادداشت‌ها',
            onClick: () => openNotesModal(record),
          },
          ...(record.type === 'company'
            ? [
                {
                  key: 'manage-products',
                  icon: <ShoppingOutlined />,
                  label: 'مدیریت محصولات',
                  onClick: () => handleManageProducts(record),
                },
              ]
            : []),
          ...(record.type === 'engineers'
            ? [
                {
                  key: 'manage-work-samples',
                  icon: <FileImageOutlined />,
                  label: 'مدیریت نمونه‌کارها',
                  onClick: () => handleManageWorkSamples(record),
                },
              ]
            : []),
          ...(record.can_set_regular
            ? [
                {
                  key: 'tag-regular',
                  icon: <TagOutlined />,
                  label: 'تنظیم به عادی',
                  onClick: () => handleSetRegular(record),
                },
              ]
            : []),
          ...(record.can_set_most_view
            ? [
                {
                  key: 'tag-most-view',
                  icon: <EyeOutlined />,
                  label: 'تنظیم به پربازدید',
                  onClick: () => handleSetMostView(record),
                },
              ]
            : []),
          ...(record.can_set_promoted
            ? [
                {
                  key: 'tag-promoted',
                  icon: <StarOutlined />,
                  label: 'تنظیم به ویژه',
                  onClick: () => handleSetPromoted(record),
                },
              ]
            : []),
        ];

        return (
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

            {(record.can_approve || record.can_reject) &&
              (record.can_approve_revision || record.can_reject_revision) && (
                <Divider type="vertical" />
              )}

            {record.can_approve_revision && (
              <Tooltip title="تایید ویرایش در انتظار تایید">
                <Button
                  type="text"
                  icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => handleApproveRevision(record)}
                  loading={actionLoading === `${record.id}-revision`}
                />
              </Tooltip>
            )}

            {record.can_reject_revision && (
              <Tooltip title="رد ویرایش در انتظار تایید">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: '#ff4d4f' }} />}
                  onClick={() => handleRejectRevision(record)}
                  loading={actionLoading === `${record.id}-revision`}
                />
              </Tooltip>
            )}

            <Tooltip title="مشاهده جزئیات">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>

            <Tooltip title="ویرایش">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>

            <Dropdown menu={{ items: moreItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  // Each of the 3 quick-filter cards below is meant to be exclusive — clicking
  // one must clear whichever of the other two was previously active, not
  // combine with it.
  const resetQuickFilterFields = () => {
    formRef.current?.setFieldsValue({
      status: undefined,
      tag: undefined,
      has_pending_revision: undefined,
    });
  };

  const handlePendingRevisionCardClick = () => {
    resetQuickFilterFields();
    // Keep the search form's dropdown in sync for display purposes, but the
    // actual filtering is driven by `pendingRevisionQuickFilter` via the
    // ProTable `params` prop below (guaranteed to trigger a refetch).
    formRef.current?.setFieldsValue({ has_pending_revision: 'yes' });
    setPendingRevisionQuickFilter(true);
    formRef.current?.submit();
  };

  const handleStatusCardClick = (status: API.ServiceStatus) => {
    setPendingRevisionQuickFilter(false);
    resetQuickFilterFields();
    formRef.current?.setFieldsValue({ status });
    formRef.current?.submit();
  };

  const handleTagCardClick = (tag: API.ServiceTag) => {
    setPendingRevisionQuickFilter(false);
    resetQuickFilterFields();
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
        <Col span={6}>
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
        <Col span={6}>
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
        <Col span={6}>
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
        <Col span={6}>
          <Card
            hoverable
            onClick={handlePendingRevisionCardClick}
            style={{ borderTop: '3px solid #faad14' }}
          >
            <Statistic
              title="به‌روزرسانی در انتظار تایید ادمین"
              value={pendingRevisionCount}
              loading={pendingRevisionStatsLoading}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable<API.ServiceItem>
        headerTitle="مدیریت خدمات"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        form={{ initialValues }}
        params={{ pendingRevisionQuickFilter }}
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
        request={async (params, sort) => {
          const categoryCodes = Array.isArray(params.category_codes)
            ? params.category_codes
            : undefined;

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

          const apiParams = {
            search: params.search,
            type: params.type,
            status: params.status,
            promotion_type: params.promotion_type,
            tag: params.tag,
            user_search: params.user_search,
            category_codes: categoryCodes,
            plan_id: params.plan_id,
            has_active_plan: params.has_active_plan,
            has_pending_revision: pendingRevisionQuickFilter
              ? 'yes'
              : params.has_pending_revision,
            created_from: createdFrom,
            created_to: createdTo,
          };

          setFilterParams(apiParams);

          const response = await getServices({
            ...apiParams,
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
            `نمایش ${range[0]}-${range[1]} از ${total} خدمت`,
        }}
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
          // onReset is supported at runtime by the underlying QueryFilter but
          // missing from this pro-components version's SearchConfig type
          // (same class of gap as the `syncToUrl` prop in User/index.tsx).
          // @ts-expect-error
          onReset: () => setPendingRevisionQuickFilter(false),
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        scroll={{ x: 1900 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Update Modal — type-specific full edit form */}
      {currentRecord?.type === 'engineers' ? (
        <UpdateFormEngineers
          visible={updateModalVisible}
          onCancel={() => {
            setUpdateModalVisible(false);
            setCurrentRecord(null);
          }}
          onSuccess={handleUpdateSuccess}
          record={currentRecord}
        />
      ) : (
        <UpdateFormCompany
          visible={updateModalVisible}
          onCancel={() => {
            setUpdateModalVisible(false);
            setCurrentRecord(null);
          }}
          onSuccess={handleUpdateSuccess}
          record={currentRecord}
        />
      )}

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

      {/* Update Priority Modal */}
      <UpdatePriorityForm
        visible={priorityModalVisible}
        onCancel={() => {
          setPriorityModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handlePriorityUpdateSuccess}
        record={currentRecord}
      />

      {/* Notes Modal */}
      <Modal
        title={`یادداشت‌های خدمت: ${notesRecord?.title || ''}`}
        open={notesModalVisible}
        onCancel={() => {
          setNotesModalVisible(false);
          setNotesRecord(null);
          setNotes([]);
        }}
        footer={null}
        width={600}
      >
        {/* Add new note */}
        <div style={{ marginBottom: 16 }}>
          <TextArea
            rows={3}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="یادداشت جدید..."
            maxLength={5000}
          />
          <Button
            type="primary"
            style={{ marginTop: 8 }}
            onClick={handleAddNote}
            loading={submittingNote}
            disabled={!newNoteContent.trim()}
          >
            ثبت یادداشت
          </Button>
        </div>

        {/* Notes list */}
        <List
          loading={notesLoading}
          dataSource={notes}
          locale={{ emptyText: 'یادداشتی ثبت نشده است' }}
          renderItem={(note) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="delete"
                  title="آیا از حذف این یادداشت مطمئنید؟"
                  onConfirm={() => handleDeleteNote(note.id)}
                  okText="بله"
                  cancelText="خیر"
                >
                  <Button type="link" danger size="small">
                    حذف
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {note.user?.first_name} {note.user?.last_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(note.created_at).format('YYYY/MM/DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={
                  <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Products Management Modal */}
      <ProductsManagementModal
        visible={productsModalVisible}
        onCancel={() => {
          setProductsModalVisible(false);
          setProductsRecord(null);
        }}
        onChanged={() => actionRef.current?.reload()}
        service={productsRecord}
      />

      {/* Work Samples Management Modal */}
      <WorkSamplesManagementModal
        visible={workSamplesModalVisible}
        onCancel={() => {
          setWorkSamplesModalVisible(false);
          setWorkSamplesRecord(null);
        }}
        onChanged={() => actionRef.current?.reload()}
        service={workSamplesRecord}
      />

      {/* Assign Plan Modal */}
      <AssignPlanForm
        visible={assignPlanModalVisible}
        onCancel={() => {
          setAssignPlanModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleAssignPlanSuccess}
        record={currentRecord}
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
                {(currentRecord.logo || currentRecord.avatar) && (
                  <Image
                    src={currentRecord.logo || currentRecord.avatar || ''}
                    alt="logo"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
              </div>
              {currentRecord.banner && (
                <Image
                  src={currentRecord.banner}
                  alt="banner"
                  width="100%"
                  height={120}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginTop: 12,
                  }}
                />
              )}
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
            <Divider orientation="right">آدرس‌ها</Divider>
            {currentRecord.addresses?.length > 0 ? (
              currentRecord.addresses.map((addr, idx) => (
                <Descriptions
                  key={idx}
                  bordered
                  column={2}
                  size="small"
                  style={{ marginBottom: 8 }}
                >
                  <Descriptions.Item label="استان">
                    {addr.province?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="شهرستان">
                    {addr.city?.name}
                  </Descriptions.Item>
                  {addr.label && (
                    <Descriptions.Item label="برچسب">
                      {addr.label}
                    </Descriptions.Item>
                  )}
                  {addr.address && (
                    <Descriptions.Item label="آدرس" span={2}>
                      {addr.address}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ))
            ) : (
              <Paragraph type="secondary">
                آدرسی برای این خدمت ثبت نشده است
              </Paragraph>
            )}
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginTop: 8 }}
            >
              {currentRecord.email && (
                <Descriptions.Item label="ایمیل">
                  <span style={{ direction: 'ltr', display: 'inline-block' }}>
                    {currentRecord.email}
                  </span>
                </Descriptions.Item>
              )}
              {currentRecord.catalog && (
                <Descriptions.Item label="کاتالوگ">
                  <a
                    href={currentRecord.catalog}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkOutlined style={{ marginLeft: 4 }} />
                    دانلود کاتالوگ
                  </a>
                </Descriptions.Item>
              )}
              {currentRecord.incorporation_year && (
                <Descriptions.Item label="سال تاسیس">
                  {currentRecord.incorporation_year}
                </Descriptions.Item>
              )}
              {currentRecord.working_hours && (
                <Descriptions.Item label="ساعات کاری">
                  {currentRecord.working_hours}
                </Descriptions.Item>
              )}
              {currentRecord.service_areas && (
                <Descriptions.Item label="مناطق تحت پوشش" span={2}>
                  {currentRecord.service_areas}
                </Descriptions.Item>
              )}
              {currentRecord.keywords && (
                <Descriptions.Item label="کلمات کلیدی" span={2}>
                  {currentRecord.keywords}
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

            {/* Products (company services) */}
            {currentRecord.type === 'company' &&
              (currentRecord.products?.length || 0) > 0 && (
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

            {/* Work Samples (engineer services) */}
            {currentRecord.type === 'engineers' &&
              (currentRecord.work_samples?.length || 0) > 0 && (
                <>
                  <Divider orientation="right">نمونه کارها</Divider>
                  <Row gutter={[16, 16]}>
                    {currentRecord.work_samples.map((sample, index) => (
                      <Col key={index} xs={12} sm={8} md={6}>
                        <Card
                          size="small"
                          cover={
                            <Image
                              src={sample.image}
                              alt={sample.title || `نمونه کار ${index + 1}`}
                              style={{
                                height: 150,
                                objectFit: 'cover',
                              }}
                            />
                          }
                        >
                          {sample.title && (
                            <Card.Meta
                              description={sample.title}
                              style={{ textAlign: 'center' }}
                            />
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}

            {/* Certifications */}
            {(currentRecord.certifications?.length || 0) > 0 && (
              <>
                <Divider orientation="right">گواهینامه‌ها</Divider>
                <Row gutter={[16, 16]}>
                  {currentRecord.certifications!.map((cert, index) => (
                    <Col key={cert.id || index} xs={12} sm={8} md={6}>
                      <a
                        href={cert.file || cert.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Card
                          size="small"
                          cover={
                            <Image
                              src={cert.file || cert.file_path}
                              alt={cert.title || `گواهینامه ${index + 1}`}
                              style={{ height: 120, objectFit: 'cover' }}
                              preview={false}
                            />
                          }
                        >
                          {cert.title && (
                            <Card.Meta
                              description={cert.title}
                              style={{ textAlign: 'center' }}
                            />
                          )}
                        </Card>
                      </a>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {/* Completed Projects */}
            {(currentRecord.completed_projects?.length || 0) > 0 && (
              <>
                <Divider orientation="right">پروژه‌های انجام شده</Divider>
                <Row gutter={[16, 16]}>
                  {currentRecord.completed_projects!.map((project, index) => (
                    <Col key={project.id || index} xs={12} sm={8} md={6}>
                      <Card
                        size="small"
                        cover={
                          <Image
                            src={project.image || project.image_path}
                            alt={project.title || `پروژه ${index + 1}`}
                            style={{ height: 150, objectFit: 'cover' }}
                          />
                        }
                      >
                        <Card.Meta
                          title={project.title || undefined}
                          description={
                            <>
                              {project.place && <div>{project.place}</div>}
                              {project.year && <div>{project.year}</div>}
                              {project.description && (
                                <div>{project.description}</div>
                              )}
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ServicesPage;
