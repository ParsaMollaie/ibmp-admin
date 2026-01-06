import { getPlans } from '@/services/plan';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const PlanPage: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Modal visibility states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // Currently selected record for editing
  const [currentRecord, setCurrentRecord] = useState<API.PlanItem | null>(null);

  // ProTable action ref - allows programmatic control of table (refresh, etc.)
  const actionRef = useRef<ActionType>();

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Open create modal
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  // Open update modal with selected record
  const handleEdit = (record: API.PlanItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Success callback for create operation
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('پلن با موفقیت ایجاد شد');
    actionRef.current?.reload();
  };

  // Success callback for update operation
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    message.success('پلن با موفقیت ویرایش شد');
    actionRef.current?.reload();
  };

  // ============================================
  // PROTABLE COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.PlanItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      search: false, // Not searchable
    },
    {
      title: 'نام پلن',
      dataIndex: 'name',
      key: 'name',
      // ProTable automatically adds search for this field
    },
    {
      title: 'مدت (ماه)',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      search: false,
      render: (_, record) => `${record.month} ماه`,
    },
    {
      title: 'قیمت (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      search: false,
      render: (_, record) => {
        const numericPrice = parseFloat(record.price);
        return numericPrice.toLocaleString('fa-IR');
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'success' : 'error'}>
          {record.status === 'active' ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: 'ویژگی‌ها',
      dataIndex: 'attributes',
      key: 'attributes',
      ellipsis: true,
      width: 200,
      search: false,
      render: (_, record) =>
        record.attributes || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 80,
      search: false,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <ProTable<API.PlanItem>
        columns={columns}
        actionRef={actionRef}
        // ProTable request function - handles params automatically
        request={async (params) => {
          const { name, current, pageSize } = params;

          const response = await getPlans({
            name: name || undefined,
            page: current,
            page_size: pageSize,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        // Toolbar configuration
        toolbar={{
          title: 'مدیریت پلن‌ها',
          actions: [
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              افزودن پلن
            </Button>,
          ],
        }}
        // Search form configuration
        search={{
          labelWidth: 'auto',
          searchText: 'جستجو',
          resetText: 'بازنشانی',
        }}
        // Pagination configuration
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} پلن`,
        }}
        // Date formatting
        dateFormatter="string"
        // Header title (optional, since we use toolbar.title)
        headerTitle={false}
      />

      {/* Create Modal */}
      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
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
    </Card>
  );
};

export default PlanPage;
