import DateRangeFilter from '@/components/DateRangeFilter';
import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getPromotionRemainingTrend, getServices } from '@/services/service';
import {
  createServiceNote,
  deleteServiceNote,
  getServiceNotes,
} from '@/services/service-notes';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
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

type QuickRange = 7 | 30 | 'all';

const quickRangeLabels: { key: QuickRange; label: string }[] = [
  { key: 7, label: '۷ روز آینده' },
  { key: 30, label: '۳۰ روز آینده' },
  { key: 'all', label: 'همه' },
];

const CHART_COLORS = {
  total: '#722ed1',
};

const typeLabels: Record<string, { text: string; color: string }> = {
  company: { text: 'شرکت', color: 'blue' },
  engineers: { text: 'مهندس/مجری', color: 'green' },
};

/**
 * Build a Jalali (dayjs, calendar-aware) [today, today+N] pair for a quick
 * forward-looking period. Never construct dayjs from a jalali-numbered
 * string under this app's global `dayjs.calendar('jalali')` patch — only
 * relative/native methods (`.add()`, `.subtract()`) are calendar-aware here.
 */
function getQuickJalaliForwardRange(days: number): [Dayjs, Dayjs] {
  return [dayjs(), dayjs().add(days, 'day')];
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

/**
 * Compute remaining days from expires_at
 */
function getRemainingDays(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  return dayjs(expiresAt).diff(dayjs(), 'day');
}

/**
 * Get color-coded Tag for remaining days
 */
function renderRemainingTag(days: number | null) {
  if (days === null) return <Tag>-</Tag>;
  if (days < 0) return <Tag color="red">منقضی شده</Tag>;
  if (days <= 7) return <Tag color="red">{days} روز</Tag>;
  if (days <= 30) return <Tag color="orange">{days} روز</Tag>;
  return <Tag color="green">{days} روز</Tag>;
}

export default function PromotionRemainingPage() {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize(
    'reports-promotion-remaining',
    20,
  );

  const [quickFilter, setQuickFilter] = useState<QuickRange | null>(30);
  // Applied filter state — what's actually sent to the backend.
  const [jalaliRange, setJalaliRange] = useState<[Dayjs, Dayjs]>(() =>
    getQuickJalaliForwardRange(30),
  );
  const [dateRange, setDateRange] = useState(() =>
    toGregorianRange(...getQuickJalaliForwardRange(30)),
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [serviceSearch, setServiceSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Staged filter state — edited freely by the user, only committed to the
  // applied state above (and sent to the backend) when "اعمال" is clicked.
  const [stagedJalaliRange, setStagedJalaliRange] = useState<[Dayjs, Dayjs]>(
    () => getQuickJalaliForwardRange(30),
  );
  const [stagedType, setStagedType] = useState<string | undefined>(undefined);
  const [stagedServiceSearch, setStagedServiceSearch] = useState('');
  const [stagedUserSearch, setStagedUserSearch] = useState('');

  // Trend chart state
  const [trendData, setTrendData] = useState<
    API.PromotionRemainingTrendPoint[]
  >([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Notes modal state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesService, setNotesService] = useState<API.ServiceItem | null>(
    null,
  );
  const [notes, setNotes] = useState<API.ServiceNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchTrend = async (start: string, end: string, type?: string) => {
    setTrendLoading(true);
    try {
      const res = await getPromotionRemainingTrend({
        start_date: start,
        end_date: end,
        type: type as API.ServiceType | undefined,
      });
      if (res.success) {
        setTrendData(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch promotion-remaining trend:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  // Re-fetch the list whenever the *applied* filter state changes. Doing
  // this in an effect (rather than calling actionRef.current?.reload()
  // synchronously right after setState in each handler) avoids a stale-closure
  // bug: React defers re-rendering until after the current event handler
  // returns, so calling reload() synchronously would re-invoke ProTable's
  // *previous* request closure — still capturing the old filter values —
  // instead of the fresh one built from the just-updated state.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    actionRef.current?.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, serviceSearch, userSearch, dateRange, quickFilter]);

  useEffect(() => {
    fetchTrend(dateRange.start_date, dateRange.end_date, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickFilter = (range: QuickRange) => {
    setQuickFilter(range);
    if (range === 'all') {
      // "all" removes the expiry-date bound from the list, but the chart
      // still needs a window — keep showing whatever range is already set.
      return;
    }
    const [start, end] = getQuickJalaliForwardRange(range);
    setJalaliRange([start, end]);
    setStagedJalaliRange([start, end]);
    const newRange = toGregorianRange(start, end);
    setDateRange(newRange);
    fetchTrend(newRange.start_date, newRange.end_date, typeFilter);
  };

  const handleApplyFilters = () => {
    setQuickFilter(null);
    setJalaliRange(stagedJalaliRange);
    const newRange = toGregorianRange(
      stagedJalaliRange[0],
      stagedJalaliRange[1],
    );
    setDateRange(newRange);
    setTypeFilter(stagedType);
    setServiceSearch(stagedServiceSearch);
    setUserSearch(stagedUserSearch);
    fetchTrend(newRange.start_date, newRange.end_date, stagedType);
  };

  const filterParams: Record<string, any> = {
    promotion_type: 'promoted',
    has_active_plan: 'yes',
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(quickFilter !== 'all'
      ? { expires_from: dateRange.start_date, expires_to: dateRange.end_date }
      : {}),
    ...(serviceSearch ? { search: serviceSearch } : {}),
    ...(userSearch ? { user_search: userSearch } : {}),
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
    setNotesService(record);
    setNotesModalVisible(true);
    setNewNoteContent('');
    await fetchNotes(record.id);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !notesService) return;
    setSubmittingNote(true);
    try {
      const res = await createServiceNote(notesService.id, {
        content: newNoteContent.trim(),
      });
      if (res.success) {
        message.success('یادداشت اضافه شد');
        setNewNoteContent('');
        await fetchNotes(notesService.id);
        actionRef.current?.reload();
      }
    } catch {
      message.error('خطا در ایجاد یادداشت');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!notesService) return;
    try {
      const res = await deleteServiceNote(noteId);
      if (res.success) {
        message.success('یادداشت حذف شد');
        await fetchNotes(notesService.id);
        actionRef.current?.reload();
      }
    } catch {
      message.error('خطا در حذف یادداشت');
    }
  };

  // ============================================
  // COLUMNS
  // ============================================

  const columns: ProColumns<API.ServiceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      sorter: true,
      search: false,
    },
    {
      title: 'عنوان',
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
      width: 110,
      sorter: true,
      search: false,
      render: (_, record) => {
        const info = typeLabels[record.type];
        return info ? <Tag color={info.color}>{info.text}</Tag> : record.type;
      },
    },
    {
      title: 'پلن',
      dataIndex: 'plan_name',
      key: 'plan_name',
      width: 120,
      sorter: true,
      search: false,
      render: (_, record) => record.latest_active_order?.plan?.name || '-',
    },
    {
      title: 'تاریخ انقضا',
      dataIndex: 'plan_expires_at',
      key: 'plan_expires_at',
      width: 140,
      sorter: true,
      search: false,
      render: (_, record) => {
        const expiresAt = record.latest_active_order?.expires_at;
        if (!expiresAt) return '-';
        return dayjs(expiresAt).format('YYYY/MM/DD');
      },
    },
    {
      title: 'روزهای مانده',
      dataIndex: 'remaining_days',
      key: 'remaining_days',
      width: 120,
      sorter: true,
      search: false,
      render: (_, record) => {
        const days = getRemainingDays(record.latest_active_order?.expires_at);
        return renderRemainingTag(days);
      },
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
        record.user ? (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() =>
              history.push(`/user?username=${record.user!.username}`)
            }
          >
            {record.user.first_name} {record.user.last_name}
          </span>
        ) : (
          '-'
        ),
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
      <Card title="روند انقضای ارتقاها" style={{ marginBottom: 16 }}>
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
              name="ارتقاهای در حال انقضا"
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
            value={stagedType}
            onChange={(value) => setStagedType(value)}
            options={[
              { label: 'شرکت', value: 'company' },
              { label: 'مهندس/مجری', value: 'engineers' },
            ]}
          />
        </Col>
        <Col>
          <Input
            placeholder="جستجوی خدمت (عنوان یا کد)"
            allowClear
            style={{ width: 220 }}
            value={stagedServiceSearch}
            onChange={(e) => setStagedServiceSearch(e.target.value)}
            onPressEnter={handleApplyFilters}
          />
        </Col>
        <Col>
          <Input
            placeholder="جستجوی کاربر"
            allowClear
            style={{ width: 220 }}
            value={stagedUserSearch}
            onChange={(e) => setStagedUserSearch(e.target.value)}
            onPressEnter={handleApplyFilters}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={handleApplyFilters}>
            اعمال
          </Button>
        </Col>
      </Row>

      <DateRangeFilter
        defaultStart={jalaliRange[0]}
        defaultEnd={jalaliRange[1]}
        onApply={() => {}}
        onChange={(start, end) => {
          if (start && end) setStagedJalaliRange([start, end]);
        }}
        hideApplyButton
        loading={trendLoading}
      />

      <ProTable<API.ServiceItem>
        headerTitle="باقیمانده ارتقا خدمات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        dateFormatter="string"
        cardBordered
        scroll={{ x: 1300 }}
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

          const res = await getServices(apiParams);

          return {
            data: res.data?.list || [],
            total: res.data?.pagination?.total || 0,
            success: res.success,
          };
        }}
      />

      {/* Notes Modal */}
      <Modal
        title={`یادداشت‌های خدمت: ${notesService?.title || ''}`}
        open={notesModalVisible}
        onCancel={() => {
          setNotesModalVisible(false);
          setNotesService(null);
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
