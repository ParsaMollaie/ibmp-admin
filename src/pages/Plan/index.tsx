import { getPlans } from '@/services/plan';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Input,
  message,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const { Title } = Typography;
const { Search } = Input;

const PlanPage: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Modal visibility states - control when create/update modals are shown
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // Currently selected record for editing - null when not editing
  const [currentRecord, setCurrentRecord] = useState<API.PlanItem | null>(null);

  // Search term state - updates trigger data refetch via refreshDeps
  const [searchName, setSearchName] = useState<string>('');

  // ============================================
  // DATA FETCHING
  // ============================================

  // useRequest hook provides automatic loading state management
  // and a refresh() function to manually refetch data
  // refreshDeps ensures data is refetched when search term changes
  const {
    data: plansData,
    loading,
    refresh,
  } = useRequest(() => getPlans({ name: searchName || undefined }), {
    refreshDeps: [searchName],
  });

  // Safely extract the list from nested API response structure
  // Falls back to empty array if data is not yet loaded
  const plans = plansData?.data?.list || [];

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Search handler - updates state which triggers useRequest refresh
  const handleSearch = (value: string) => {
    setSearchName(value);
  };

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
  // Closes modal, shows success message, and refreshes data
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('پلن با موفقیت ایجاد شد');
    refresh();
  };

  // Success callback for update operation
  // Clears current record, closes modal, shows message, refreshes data
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    message.success('پلن با موفقیت ویرایش شد');
    refresh();
  };

  // ============================================
  // TABLE COLUMN DEFINITIONS
  // ============================================

  // Define table columns with proper typing for API.PlanItem
  const columns: ColumnsType<API.PlanItem> = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
    },
    {
      title: 'نام پلن',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'مدت (ماه)',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      // Render month count with Persian label
      render: (month: number) => `${month} ماه`,
    },
    {
      title: 'قیمت (تومان)',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      // Format price with thousand separators for readability
      render: (price: string) => {
        const numericPrice = parseFloat(price);
        return numericPrice.toLocaleString('fa-IR');
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      // Render status as colored tag
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: 'ویژگی‌ها',
      dataIndex: 'attributes',
      key: 'attributes',
      ellipsis: true, // Truncate long text with ellipsis
      width: 200,
      // Show dash if no attributes
      render: (attributes: string) =>
        attributes || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 80,
      // Render edit button that opens update modal
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
      {/* Header section with title and action buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          مدیریت پلن‌ها
        </Title>
        <Space>
          {/* Search input - triggers data refresh on search */}
          <Search
            placeholder="جستجو بر اساس نام..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
          />
          {/* Create button - opens create modal */}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            افزودن پلن
          </Button>
        </Space>
      </div>

      {/* Main data table */}
      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        pagination={{
          // Pagination config from API response
          total: plansData?.data?.pagination?.total || 0,
          pageSize: plansData?.data?.pagination?.page_size || 10,
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} پلن`,
        }}
      />

      {/* Create Modal - mounted always but visibility controlled */}
      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Update Modal - receives current record for editing */}
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
