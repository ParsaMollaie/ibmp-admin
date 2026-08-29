import DateRangeFilter from '@/components/DateRangeFilter';
import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import {
  getServiceActivityReport,
  getServiceActivityTrend,
} from '@/services/service';
import {
  createServiceNote,
  deleteServiceNote,
  getServiceNotes,
} from '@/services/service-notes';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
import { exportAllToExcel, ExportColumn } from '@/utils/exportExcel';
import { DownloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { history } from 'umi';

const { TextArea } = Input;
const { Text } = Typography;

type QuickRange = 7 | 30 | 90 | 'year';

const quickRangeLabels: { key: QuickRange; label: string }[] = [
  { key: 7, label: '۷ روز اخیر' },
  { key: 30, label: '۳۰ روز اخیر' },
  { key: 90, label: '۹۰ روز اخیر' },
  { key: 'year', label: 'امسال' },
];

const CHART_COLORS = {
  total: '#722ed1',
};

const serviceTypeMap: Record<string, { text: string; color: string }> = {
  company: { text: 'شرکت', color: 'blue' },
  engineers: { text: 'مهندسان', color: 'green' },
};

/**
 * Build a Jalali (dayjs, calendar-aware) [start, end] pair for a quick period.
 * Never construct dayjs from a jalali-numbered string under this app's global
 * `dayjs.calendar('jalali')` patch — string parsing is NOT calendar-aware and
 * silently produces a nonsense date (confirmed: only relative/native methods
 * like `.subtract()`/`.startOf()` are calendar-aware here).
 */
function getQuickJalaliRange(range: QuickRange): [Dayjs, Dayjs] {
  const end = dayjs();
  if (range === 'year') {
    return [dayjs().startOf('year'), end];
  }
  return [dayjs().subtract(range, 'day'), end];
}

/**
 * Convert a Jalali [start, end] pair to Gregorian "YYYY-MM-DD" strings for
 * the API, via `convertFaDateToEnDate` (the only safe way to cross from the
 * app's Jalali-tagged dayjs values to a real Gregorian date).
 */
function toGregorianRange(
  start: Dayjs,
  end: Dayjs,
): { start_date: string; end_date: string } {
  return {
    start_date: convertFaDateToEnDate(start.toDate()).format('YYYY-MM-DD'),
    end_date: convertFaDateToEnDate(end.toDate()).format('YYYY-MM-DD'),
  };
}

// Export column definitions
const exportColumns: ExportColumn[] = [
  { title: 'کد', dataIndex: 'code' },
  { title: 'خدمات', dataIndex: 'title' },
  {
    title: 'نوع',
    dataIndex: 'type',
    render: (value) => serviceTypeMap[value]?.text || value,
  },
  {
    title: 'دسته‌بندی',
    dataIndex: 'category_title',
    render: (_, record) => record.category_title || '—',
  },
  {
    title: 'کاربر',
    dataIndex: 'user_name',
    render: (_, record) => record.user_name || '—',
  },
  { title: 'بازدید', dataIndex: 'view_count' },
  { title: 'کلیک تماس', dataIndex: 'call_click_count' },
  { title: 'کلیک وبسایت', dataIndex: 'website_click_count' },
  { title: 'دانلود کاتالوگ', dataIndex: 'catalog_download_count' },
  { title: 'شبکه اجتماعی', dataIndex: 'social_click_count' },
  { title: 'اشتراک‌گذاری', dataIndex: 'share_click_count' },
  { title: 'کل فعالیت', dataIndex: 'total_count' },
];

export default function ServiceActivityReport() {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize(
    'reports-service-activity',
    20,
  );

  const [quickFilter, setQuickFilter] = useState<QuickRange | null>(30);
  const [jalaliRange, setJalaliRange] = useState<[Dayjs, Dayjs]>(() =>
    getQuickJalaliRange(30),
  );
  const [dateRange, setDateRange] = useState(() =>
    toGregorianRange(...getQuickJalaliRange(30)),
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  // Trend chart state
  const [trendData, setTrendData] = useState<API.ServiceActivityTrendPoint[]>(
    [],
  );
  const [trendLoading, setTrendLoading] = useState(false);

  // Notes modal state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesRecord, setNotesRecord] =
    useState<API.ServiceActivityItem | null>(null);
  const [notes, setNotes] = useState<API.ServiceNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchTrend = async (start: string, end: string, type?: string) => {
    setTrendLoading(true);
    try {
      const res = await getServiceActivityTrend({
        start_date: start,
        end_date: end,
        type: type as API.ServiceType | undefined,
      });
      if (res.success) {
        setTrendData(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity trend:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    fetchTrend(dateRange.start_date, dateRange.end_date, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickFilter = (range: QuickRange) => {
    setQuickFilter(range);
    const [start, end] = getQuickJalaliRange(range);
    setJalaliRange([start, end]);
    const newRange = toGregorianRange(start, end);
    setDateRange(newRange);
    actionRef.current?.reload();
    fetchTrend(newRange.start_date, newRange.end_date, typeFilter);
  };

  const handleCustomDateRange = (start: Dayjs, end: Dayjs) => {
    setQuickFilter(null);
    setJalaliRange([start, end]);
    const newRange = toGregorianRange(start, end);
    setDateRange(newRange);
    actionRef.current?.reload();
    fetchTrend(newRange.start_date, newRange.end_date, typeFilter);
  };

  const handleTypeChange = (value?: string) => {
    setTypeFilter(value);
    actionRef.current?.reload();
    fetchTrend(dateRange.start_date, dateRange.end_date, value);
  };

  const filterParams: Record<string, any> = {
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    ...(typeFilter ? { type: typeFilter } : {}),
  };

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
        (params) => getServiceActivityReport(params as any),
        filterParams,
        exportColumns,
        'service-activity-report',
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

  const openNotesModal = async (record: API.ServiceActivityItem) => {
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

  // ============================================
  // COLUMNS
  // ============================================

  const columns: ProColumns<API.ServiceActivityItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      sorter: true,
      search: false,
    },
    {
      title: 'خدمات',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      sorter: true,
      search: false,
      render: (_, record) => (
        <span
          style={{ cursor: 'pointer', color: '#1890ff' }}
          onClick={() =>
            history.push(
              `/services?type=${record.type}&search=${encodeURIComponent(
                record.title,
              )}`,
            )
          }
        >
          {record.title}
        </span>
      ),
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      sorter: true,
      search: false,
      render: (_, record) => {
        const info = serviceTypeMap[record.type];
        return info ? <Tag color={info.color}>{info.text}</Tag> : record.type;
      },
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category_title',
      key: 'category_title',
      width: 150,
      ellipsis: true,
      sorter: true,
      search: false,
    },
    {
      title: 'کاربر',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 150,
      ellipsis: true,
      sorter: true,
      search: false,
      render: (_, record) =>
        record.username ? (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => history.push(`/user?username=${record.username}`)}
          >
            {record.user_name}
          </span>
        ) : (
          record.user_name || '—'
        ),
    },
    {
      title: 'بازدید',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کلیک تماس',
      dataIndex: 'call_click_count',
      key: 'call_click_count',
      width: 100,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کلیک وبسایت',
      dataIndex: 'website_click_count',
      key: 'website_click_count',
      width: 110,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'دانلود کاتالوگ',
      dataIndex: 'catalog_download_count',
      key: 'catalog_download_count',
      width: 120,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'شبکه اجتماعی',
      dataIndex: 'social_click_count',
      key: 'social_click_count',
      width: 120,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'اشتراک‌گذاری',
      dataIndex: 'share_click_count',
      key: 'share_click_count',
      width: 110,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کل فعالیت',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 100,
      sorter: true,
      defaultSortOrder: 'descend',
      search: false,
      align: 'center',
      render: (_, record) => <strong>{record.total_count}</strong>,
    },
    {
      title: 'یادداشت',
      key: 'notes',
      width: 100,
      search: false,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openNotesModal(record)}>
          {(record.notes_count ?? 0) > 0
            ? `${record.notes_count} یادداشت`
            : 'افزودن'}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Trend Chart */}
      <Card title="روند فعالیت خدمات" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total_count"
              name="کل فعالیت"
              stroke={CHART_COLORS.total}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.total, r: 3 }}
              isAnimationActive={!trendLoading}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Prominent filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
        <Col>
          <Space wrap>
            {quickRangeLabels.map((item) => (
              <Button
                key={item.key}
                type={quickFilter === item.key ? 'primary' : 'default'}
                onClick={() => handleQuickFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </Space>
        </Col>
        <Col>
          <Select
            allowClear
            placeholder="همه انواع"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={handleTypeChange}
            options={[
              { label: 'شرکت', value: 'company' },
              { label: 'مهندسان', value: 'engineers' },
            ]}
          />
        </Col>
      </Row>

      <DateRangeFilter
        defaultStart={jalaliRange[0]}
        defaultEnd={jalaliRange[1]}
        onApply={handleCustomDateRange}
        loading={trendLoading}
      />

      <ProTable<API.ServiceActivityItem>
        headerTitle="گزارش فعالیت خدمات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        dateFormatter="string"
        cardBordered
        scroll={{ x: 1700 }}
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
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          showTotal: (total) => `مجموع: ${total} خدمت`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: { listsHeight: 400 },
        }}
        request={async (params, sort) => {
          const apiParams: Record<string, any> = {
            ...filterParams,
            page: params.current || 1,
            page_size: params.pageSize || 20,
          };

          if (sort && Object.keys(sort).length > 0) {
            apiParams.sorter = JSON.stringify(sort);
          }

          const res = await getServiceActivityReport(apiParams);

          return {
            data: res.data?.list || [],
            total: res.data?.pagination?.total || 0,
            success: res.success,
          };
        }}
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
    </PageContainer>
  );
}
