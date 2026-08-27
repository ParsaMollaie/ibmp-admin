import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import {
  approveSuggestCategory,
  deleteSuggestCategory,
  getSuggestCategories,
  rejectSuggestCategory,
} from '@/services/suggest-category';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import UpdateForm from './components/UpdateForm';

/**
 * Status configuration for ProTable's valueEnum feature
 */
const statusEnum: Record<string, { text: string; status: string }> = {
  pending: { text: 'در انتظار بررسی', status: 'Warning' },
  approved: { text: 'تایید شده', status: 'Success' },
  rejected: { text: 'رد شده', status: 'Error' },
};

/**
 * Get color for status Tag component
 */
const getStatusColor = (status: API.SuggestCategoryStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };
  return colorMap[status] || 'default';
};

/**
 * Get Persian label for status
 */
const getStatusLabel = (status: API.SuggestCategoryStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار بررسی',
    approved: 'تایید شده',
    rejected: 'رد شده',
  };
  return labelMap[status] || status;
};

const SuggestCategoryPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pageSize, setPageSize] = usePersistedPageSize('suggest-category', 10);
  const [currentRecord, setCurrentRecord] =
    useState<API.SuggestCategoryItem | null>(null);

  // Handle edit
  const handleEdit = (record: API.SuggestCategoryItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // Handle approve action with confirmation
  const handleApprove = (record: API.SuggestCategoryItem) => {
    Modal.confirm({
      title: 'تایید پیشنهاد',
      content: `آیا از تایید پیشنهاد "${record.title}" اطمینان دارید؟`,
      okText: 'بله، تایید شود',
      cancelText: 'انصراف',
      okType: 'primary',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await approveSuggestCategory(record.id);
          if (response.success) {
            message.success('پیشنهاد با موفقیت تایید شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در تایید پیشنهاد');
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
  const handleReject = (record: API.SuggestCategoryItem) => {
    Modal.confirm({
      title: 'رد پیشنهاد',
      content: `آیا از رد پیشنهاد "${record.title}" اطمینان دارید؟`,
      okText: 'بله، رد شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await rejectSuggestCategory(record.id);
          if (response.success) {
            message.success('پیشنهاد با موفقیت رد شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در رد پیشنهاد');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Handle delete action with confirmation
  const handleDelete = (record: API.SuggestCategoryItem) => {
    Modal.confirm({
      title: 'حذف پیشنهاد',
      content: `آیا از حذف پیشنهاد "${record.title}" اطمینان دارید؟`,
      okText: 'بله، حذف شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await deleteSuggestCategory(record.id);
          if (response.success) {
            message.success('پیشنهاد با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف پیشنهاد');
          }
        } catch (error) {
          message.error('خطا در برقراری ارتباط با سرور');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Column definitions
  const columns: ProColumns<API.SuggestCategoryItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      fieldProps: {
        placeholder: 'عنوان را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.description || '—',
      sorter: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      hideInSearch: true,
      render: (_, record) =>
        new Date(record.created_at).toLocaleString('fa-IR'),
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      key: 'updated_at',
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
      dataIndex: 'created_by',
      key: 'created_by',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      key: 'updated_by',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 180,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.can_approve && (
            <Tooltip title="تایید">
              <Button
                type="text"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleApprove(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          {record.can_reject && (
            <Tooltip title="رد">
              <Button
                type="text"
                icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                onClick={() => handleReject(record)}
                loading={actionLoading === record.id}
              />
            </Tooltip>
          )}

          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Tooltip title="حذف">
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
              onClick={() => handleDelete(record)}
              loading={actionLoading === record.id}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<API.SuggestCategoryItem>
        headerTitle="مدیریت پیشنهاد دسته‌بندی"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params, sort) => {
          const response = await getSuggestCategories({
            title: params.title,
            status: params.status,
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
            `نمایش ${range[0]}-${range[1]} از ${total} پیشنهاد`,
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
        scroll={{ x: 1100 }}
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
    </>
  );
};

export default SuggestCategoryPage;
