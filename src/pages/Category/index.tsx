import { deleteCategory, getCategories } from '@/services/category';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Image, Modal, Space, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

// ============================================
// CONFIGURATION OBJECTS
// ============================================

/**
 * Status configuration for ProTable valueEnum
 * This provides both the dropdown filter options and the cell rendering
 *
 * The 'status' property maps to ProTable's built-in status styling:
 * - 'Success' = green
 * - 'Error' = red
 * - 'Processing' = blue
 * - 'Default' = gray
 */
const statusEnum: Record<string, { text: string; status: string }> = {
  active: { text: 'فعال', status: 'Success' },
  inactive: { text: 'غیرفعال', status: 'Error' },
};

/**
 * Helper function to get status Tag configuration
 * Used for custom rendering with Ant Design Tag component
 */
const getStatusConfig = (
  status: 'active' | 'inactive' | undefined,
): { color: string; label: string } => {
  const statusMap: Record<string, { color: string; label: string }> = {
    active: { color: 'success', label: 'فعال' },
    inactive: { color: 'error', label: 'غیرفعال' },
  };
  return statusMap[status || 'active'] || { color: 'default', label: 'نامشخص' };
};

const CategoryPage: React.FC = () => {
  // ============================================
  // STATE & REFS
  // ============================================

  /**
   * ActionType ref for programmatic ProTable control
   * Common uses:
   * - actionRef.current?.reload() - Refresh table data
   * - actionRef.current?.reset() - Reset all filters
   * - actionRef.current?.clearSelected() - Clear row selections
   */
  const actionRef = useRef<ActionType>();

  // Modal visibility states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // Currently selected record for edit/delete operations
  const [currentRecord, setCurrentRecord] = useState<API.CategoryItem | null>(
    null,
  );

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Open create modal
   */
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  /**
   * Open edit modal with selected record
   */
  const handleEdit = (record: API.CategoryItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  /**
   * Handle delete with confirmation dialog
   * Uses Modal.confirm for a clean confirmation UX
   */
  const handleDelete = (record: API.CategoryItem) => {
    Modal.confirm({
      title: 'حذف دسته‌بندی',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف دسته‌بندی زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.title}</p>
          {record.parent && (
            <p style={{ fontSize: 12, color: '#666' }}>
              زیرمجموعه: {record.parent.title}
            </p>
          )}
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      // Async onOk handles the delete operation
      onOk: async () => {
        try {
          const response = await deleteCategory(record.id);
          if (response.success) {
            message.success('دسته‌بندی با موفقیت حذف شد');
            // Reload table to reflect changes
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف دسته‌بندی');
          }
        } catch (error) {
          console.error('Delete category error:', error);
          message.error('خطا در ارتباط با سرور');
        }
      },
    });
  };

  /**
   * Callback after successful create/update
   * Closes modal and refreshes table data
   */
  const handleSuccess = () => {
    setCreateModalVisible(false);
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================

  /**
   * ProColumns configuration
   *
   * Key properties used:
   * - hideInSearch: Excludes column from search form
   * - valueType: Determines filter input type ('select', 'text', 'date', etc.)
   * - valueEnum: Provides options for select filters and cell rendering
   * - ellipsis: Truncates long text with '...'
   * - fixed: Keeps column visible during horizontal scroll
   */
  const columns: ProColumns<API.CategoryItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      hideInSearch: true,
      // Sort by code (useful for finding recently added items)
      sorter: (a, b) => a.code - b.code,
    },
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      hideInSearch: true,
      render: (_, record) =>
        record.image ? (
          <Image
            src={record.image}
            alt={record.alt_image || record.title}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      // This column IS searchable - text input will be auto-generated
      fieldProps: {
        placeholder: 'جستجوی عنوان',
      },
    },
    {
      title: 'دسته‌بندی والد',
      dataIndex: ['parent', 'title'],
      key: 'parent',
      width: 150,
      hideInSearch: true, // Parent filter would need a separate dropdown
      render: (_, record) =>
        record.parent ? (
          <Tag>{record.parent.title}</Tag>
        ) : (
          <Tag color="blue">دسته اصلی</Tag>
        ),
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      hideInSearch: true,
      // Sort by priority
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      // Use select dropdown for filtering
      valueType: 'select',
      valueEnum: statusEnum,
      // Custom render with colored Tags
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      hideInSearch: true,
      // Format date for display
      render: (_, record) => {
        if (!record.created_at) return '—';
        // Convert ISO date to Persian-friendly format
        const date = new Date(record.created_at);
        return date.toLocaleDateString('fa-IR');
      },
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 120,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="ویرایش"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="حذف"
          />
        </Space>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <ProTable<API.CategoryItem>
        headerTitle="مدیریت دسته‌بندی‌ها"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        /**
         * Request function called on:
         * 1. Initial load
         * 2. Filter/search changes
         * 3. Pagination changes
         * 4. actionRef.current.reload()
         *
         * Params include all filter values plus pagination info
         */
        request={async (params) => {
          // Map ProTable params to API params
          const response = await getCategories({
            title: params.title,
            status: params.status,
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
            `نمایش ${range[0]}-${range[1]} از ${total} دسته‌بندی`,
        }}
        /**
         * Search form configuration
         */
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
        }}
        /**
         * Toolbar configuration
         * toolBarRender adds custom buttons to the toolbar
         */
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            افزودن دسته‌بندی
          </Button>,
        ]}
        /**
         * Table options (top-right icons)
         */
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        scroll={{ x: 1000 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Create Category Modal */}
      <CreateForm
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        onSuccess={handleSuccess}
      />

      {/* Update Category Modal */}
      <UpdateForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleSuccess}
        record={currentRecord}
      />
    </>
  );
};

export default CategoryPage;
