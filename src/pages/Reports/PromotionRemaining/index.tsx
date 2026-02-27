import { getServices } from '@/services/service';
import {
  createServiceNote,
  deleteServiceNote,
  getServiceNotes,
} from '@/services/service-notes';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

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

const typeLabels: Record<string, string> = {
  company: 'شرکت',
  engineers: 'مهندس/مجری',
};

const PromotionRemainingPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // Quick filter preset
  const [quickFilter, setQuickFilter] = useState<number | undefined>(undefined);

  // Notes modal state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesService, setNotesService] = useState<API.ServiceItem | null>(
    null,
  );
  const [notes, setNotes] = useState<API.ServiceNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

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
      hideInSearch: true,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      valueType: 'select',
      valueEnum: {
        company: { text: 'شرکت' },
        engineers: { text: 'مهندس/مجری' },
      },
      render: (_, record) => (
        <Tag>{typeLabels[record.type] || record.type}</Tag>
      ),
      fieldProps: {
        placeholder: 'نوع خدمت',
      },
    },
    {
      title: 'پلن',
      key: 'plan',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.latest_active_order?.plan?.name || '-',
    },
    {
      title: 'تاریخ انقضا',
      key: 'expires_at',
      width: 140,
      hideInSearch: true,
      render: (_, record) => {
        const expiresAt = record.latest_active_order?.expires_at;
        if (!expiresAt) return '-';
        return dayjs(expiresAt).format('YYYY/MM/DD');
      },
    },
    {
      title: 'روزهای مانده',
      key: 'remaining',
      width: 120,
      hideInSearch: true,
      sorter: (a, b) => {
        const daysA =
          getRemainingDays(a.latest_active_order?.expires_at) ?? 9999;
        const daysB =
          getRemainingDays(b.latest_active_order?.expires_at) ?? 9999;
        return daysA - daysB;
      },
      defaultSortOrder: 'ascend',
      render: (_, record) => {
        const days = getRemainingDays(record.latest_active_order?.expires_at);
        return renderRemainingTag(days);
      },
    },
    {
      title: 'کاربر',
      key: 'user',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => {
        if (!record.user) return '-';
        return `${record.user.first_name} ${record.user.last_name}`;
      },
    },
    {
      title: 'روز انقضا',
      dataIndex: 'expires_within_days',
      key: 'expires_within_days',
      hideInTable: true,
      renderFormItem: () => (
        <InputNumber placeholder="مثلاً 10" min={1} style={{ width: '100%' }} />
      ),
    },
    {
      title: 'یادداشت',
      key: 'notes',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openNotesModal(record)}>
          {(record.notes_count ?? 0) > 0
            ? `${record.notes_count} یادداشت`
            : 'افزودن'}
        </Button>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Quick filter buttons */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type={quickFilter === 7 ? 'primary' : 'default'}
          danger={quickFilter === 7}
          onClick={() => {
            setQuickFilter(7);
            actionRef.current?.reload();
          }}
        >
          بحرانی (۷ روز یا کمتر)
        </Button>
        <Button
          type={quickFilter === 30 ? 'primary' : 'default'}
          onClick={() => {
            setQuickFilter(30);
            actionRef.current?.reload();
          }}
        >
          هشدار (۳۰ روز یا کمتر)
        </Button>
        <Button
          type={quickFilter === undefined ? 'primary' : 'default'}
          onClick={() => {
            setQuickFilter(undefined);
            actionRef.current?.reload();
          }}
        >
          همه
        </Button>
      </Space>

      <ProTable<API.ServiceItem>
        headerTitle="باقیمانده ارتقا خدمات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const apiParams: Record<string, any> = {
            promotion_type: 'promoted',
            has_active_plan: 'yes',
            type: params.type || undefined,
          };

          // Use quick filter or form filter for expires_within_days
          const expiresWithin = params.expires_within_days || quickFilter;
          if (expiresWithin) {
            apiParams.expires_within_days = expiresWithin;
          }

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
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
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
          setting: { listsHeight: 400 },
        }}
        scroll={{ x: 1100 }}
        dateFormatter="string"
        cardBordered
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
    </>
  );
};

export default PromotionRemainingPage;
