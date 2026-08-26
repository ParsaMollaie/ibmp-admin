import { getPlans } from '@/services/plan';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, message, Space, Tag } from 'antd';
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
      sorter: true,
    },
    {
      title: 'نام پلن',
      dataIndex: 'name',
      key: 'name',
      // ProTable automatically adds search for this field
      sorter: true,
    },
    {
      title: 'نوع',
      dataIndex: 'is_free_trial',
      key: 'is_free_trial',
      width: 130,
      search: false,
      render: (_, record) => (
        <Tag color={record.is_free_trial ? 'green' : 'blue'}>
          {record.is_free_trial ? 'آزمایشی رایگان' : 'پولی'}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: 'مدت (ماه)',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      search: false,
      render: (_, record) => `${record.month} ماه`,
      sorter: true,
    },
    {
      title: 'قیمت (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      search: false,
      render: (_, record) => {
        const numericPrice = parseFloat(record.price);
        if (numericPrice === 0) return <Tag color="green">رایگان</Tag>;
        return numericPrice.toLocaleString('fa-IR');
      },
      sorter: true,
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
      sorter: true,
    },
    {
      title: 'ویژگی‌ها',
      dataIndex: 'features',
      key: 'features',
      width: 250,
      search: false,
      render: (_, record) => {
        if (!record.features || record.features.length === 0) {
          // Fallback to old attributes if no features
          // return record.attributes || <span style={{ color: '#999' }}>—</span>;
          return <span style={{ color: '#999' }}>—</span>;
        }
        return (
          <Space direction="vertical" size={2}>
            {record.features.map((feature, index) => (
              <span key={index}>
                {feature.included ? (
                  <CheckCircleOutlined
                    style={{ color: '#52c41a', marginLeft: 4 }}
                  />
                ) : (
                  <CloseCircleOutlined
                    style={{ color: '#999', marginLeft: 4 }}
                  />
                )}
                <span
                  style={{
                    color: feature.included ? undefined : '#999',
                    textDecoration: feature.included ? 'none' : 'line-through',
                  }}
                >
                  {feature.title}
                </span>
              </span>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      search: false,
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      search: false,
      valueType: 'dateTime',
      sorter: true,
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
        request={async (params, sort) => {
          const { name, current, pageSize } = params;

          const response = await getPlans({
            name: name || undefined,
            page: current,
            page_size: pageSize,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
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
        // Horizontal scroll for responsiveness
        scroll={{ x: 1200 }}
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
