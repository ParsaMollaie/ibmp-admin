import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import {
  Button,
  Descriptions,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import { history } from 'umi';

const { Text } = Typography;
const { TextArea } = Input;

type LeadItem = {
  id: string;
  code: number;
  service: API.LeadRequestService | null;
  user: API.OrderUser | null;
  full_name: string;
  mobile: string;
  email: string | null;
  project_title: string;
  description: string | null;
  status: API.LeadRequestStatus;
  notes_count?: number;
  created_at: string;
  updated_at: string;
};

type LeadNoteItem = {
  id: string;
  content: string;
  user: API.OrderUser;
  created_at: string;
};

const STATUS_COLOR: Record<API.LeadRequestStatus, string> = {
  pending: 'warning',
  followed_up: 'processing',
  closed: 'default',
};

const STATUS_LABEL: Record<API.LeadRequestStatus, string> = {
  pending: 'در انتظار پیگیری',
  followed_up: 'پیگیری شده',
  closed: 'بسته شده',
};

const getServiceTypeLabel = (type?: string): string => {
  const typeMap: Record<string, string> = {
    company: 'شرکت',
    engineers: 'مهندسان',
  };
  return type ? typeMap[type] || type : '—';
};

type LeadsTableProps<T extends LeadItem> = {
  storageKey: string;
  headerTitle: string;
  searchPlaceholder: string;
  /** Extra ProTable columns rendered between "عنوان پروژه" and "وضعیت" (e.g. project address for visit requests) */
  extraColumns?: ProColumns<T>[];
  /** Extra rows appended to the detail modal's Descriptions (e.g. address/preferred date+time) */
  renderExtraDetails?: (record: T) => React.ReactNode;
  fetchList: (params: {
    status?: API.LeadRequestStatus;
    search?: string;
    page?: number;
    page_size?: number;
    sorter?: string;
  }) => Promise<API.ApiResponse<API.PaginatedResponse<T>>>;
  updateStatus: (
    id: string,
    data: { status: API.LeadRequestStatus },
  ) => Promise<API.ApiResponse<[]>>;
  fetchNotes: (id: string) => Promise<API.ApiResponse<LeadNoteItem[]>>;
  createNote: (
    id: string,
    data: { content: string },
  ) => Promise<API.ApiResponse<LeadNoteItem>>;
  deleteNote: (noteId: string) => Promise<API.ApiResponse<[]>>;
  /** Permission required to change the record's status */
  updatePermission: string;
  /** Permission required to add a note */
  addNotePermission: string;
  /** Permission required to delete a note */
  deleteNotePermission: string;
};

function LeadsTable<T extends LeadItem>({
  storageKey,
  headerTitle,
  searchPlaceholder,
  extraColumns = [],
  renderExtraDetails,
  fetchList,
  updateStatus,
  fetchNotes,
  createNote,
  deleteNote,
  updatePermission,
  addNotePermission,
  deleteNotePermission,
}: LeadsTableProps<T>) {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize(storageKey, 10);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<T | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [notesVisible, setNotesVisible] = useState(false);
  const [notesRecord, setNotesRecord] = useState<T | null>(null);
  const [notes, setNotes] = useState<LeadNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleViewDetail = (record: T) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleStatusChange = async (
    record: T,
    status: API.LeadRequestStatus,
  ) => {
    setStatusUpdating(true);
    try {
      const res = await updateStatus(record.id, { status });
      if (res.success) {
        message.success('وضعیت بروزرسانی شد');
        actionRef.current?.reload();
        if (currentRecord?.id === record.id) {
          setCurrentRecord({ ...currentRecord, status });
        }
      }
    } catch {
      message.error('خطا در بروزرسانی وضعیت');
    } finally {
      setStatusUpdating(false);
    }
  };

  const fetchAndSetNotes = async (id: string) => {
    setNotesLoading(true);
    try {
      const res = await fetchNotes(id);
      if (res.success) {
        setNotes(res.data || []);
      }
    } catch {
      message.error('خطا در دریافت یادداشت‌ها');
    } finally {
      setNotesLoading(false);
    }
  };

  const openNotesModal = async (record: T) => {
    setNotesRecord(record);
    setNotesVisible(true);
    setNewNoteContent('');
    await fetchAndSetNotes(record.id);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !notesRecord) return;
    setSubmittingNote(true);
    try {
      const res = await createNote(notesRecord.id, {
        content: newNoteContent.trim(),
      });
      if (res.success) {
        message.success('یادداشت اضافه شد');
        setNewNoteContent('');
        await fetchAndSetNotes(notesRecord.id);
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
      const res = await deleteNote(noteId);
      if (res.success) {
        message.success('یادداشت حذف شد');
        await fetchAndSetNotes(notesRecord.id);
        actionRef.current?.reload();
      }
    } catch {
      message.error('خطا در حذف یادداشت');
    }
  };

  const columns: ProColumns<T>[] = [
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
      title: 'کاربر (مالک خدمت)',
      dataIndex: 'user',
      hideInSearch: true,
      width: 160,
      render: (_, record) =>
        record.user ? (
          <Space
            direction="vertical"
            size={0}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              history.push(`/user?username=${record.user!.username}`)
            }
          >
            <Text strong style={{ color: '#1890ff' }}>
              {record.user.first_name} {record.user.last_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user.username}
            </Text>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'نام و نام خانوادگی',
      dataIndex: 'full_name',
      hideInSearch: true,
      width: 150,
      sorter: true,
    },
    {
      title: 'موبایل',
      dataIndex: 'mobile',
      hideInSearch: true,
      width: 130,
      render: (_, record) => <span dir="ltr">{record.mobile}</span>,
    },
    {
      title: 'عنوان پروژه',
      dataIndex: 'project_title',
      hideInSearch: true,
      width: 160,
      ellipsis: true,
    },
    ...extraColumns,
    {
      title: 'وضعیت',
      dataIndex: 'status',
      width: 160,
      valueType: 'select',
      valueEnum: {
        pending: { text: 'در انتظار پیگیری', status: 'Warning' },
        followed_up: { text: 'پیگیری شده', status: 'Processing' },
        closed: { text: 'بسته شده', status: 'Default' },
      },
      render: (_, record) =>
        access.hasPermission(updatePermission) ? (
          <Select<API.LeadRequestStatus>
            size="small"
            value={record.status}
            style={{ width: 140 }}
            loading={statusUpdating}
            onChange={(value) => handleStatusChange(record, value)}
            options={[
              { value: 'pending', label: 'در انتظار پیگیری' },
              { value: 'followed_up', label: 'پیگیری شده' },
              { value: 'closed', label: 'بسته شده' },
            ]}
          />
        ) : (
          <Tag color={STATUS_COLOR[record.status]}>
            {STATUS_LABEL[record.status]}
          </Tag>
        ),
    },
    {
      title: 'جستجو',
      dataIndex: 'search',
      hideInTable: true,
      fieldProps: {
        placeholder: searchPlaceholder,
      },
    },
    {
      title: 'تاریخ ثبت',
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
      title: 'یادداشت‌ها',
      key: 'notes',
      hideInSearch: true,
      width: 110,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openNotesModal(record)}>
          {(record.notes_count ?? 0) > 0
            ? `${record.notes_count} یادداشت`
            : 'افزودن'}
        </Button>
      ),
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="مشاهده جزئیات">
          <a onClick={() => handleViewDetail(record)}>
            <EyeOutlined />
          </a>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <ProTable<T>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        headerTitle={headerTitle}
        request={async (params, sort) => {
          const response = await fetchList({
            status: params.status,
            search: params.search,
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
            `نمایش ${range[0]}-${range[1]} از ${total} مورد`,
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
        scroll={{ x: 1200 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Detail Modal */}
      <Modal
        title="جزئیات درخواست"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={600}
      >
        {currentRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="کد">
              {currentRecord.code}
            </Descriptions.Item>
            <Descriptions.Item label="نام و نام خانوادگی">
              {currentRecord.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="موبایل">
              <span dir="ltr">{currentRecord.mobile}</span>
            </Descriptions.Item>
            {currentRecord.email && (
              <Descriptions.Item label="ایمیل">
                <span dir="ltr">{currentRecord.email}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="عنوان پروژه">
              {currentRecord.project_title}
            </Descriptions.Item>
            {renderExtraDetails?.(currentRecord)}
            {currentRecord.description && (
              <Descriptions.Item label="توضیحات">
                {currentRecord.description}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="وضعیت">
              <Tag color={STATUS_COLOR[currentRecord.status]}>
                {STATUS_LABEL[currentRecord.status]}
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
              </>
            )}
            <Descriptions.Item label="تاریخ ثبت">
              {new Date(currentRecord.created_at).toLocaleString('fa-IR')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        title={`یادداشت‌های درخواست: ${notesRecord?.full_name || ''}`}
        open={notesVisible}
        onCancel={() => {
          setNotesVisible(false);
          setNotesRecord(null);
          setNotes([]);
        }}
        footer={null}
        width={600}
      >
        {access.hasPermission(addNotePermission) && (
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
        )}

        <List
          loading={notesLoading}
          dataSource={notes}
          locale={{ emptyText: 'یادداشتی ثبت نشده است' }}
          renderItem={(note) => (
            <List.Item
              actions={
                access.hasPermission(deleteNotePermission)
                  ? [
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
                    ]
                  : []
              }
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {note.user?.first_name} {note.user?.last_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(note.created_at).toLocaleString('fa-IR')}
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
}

export default LeadsTable;
