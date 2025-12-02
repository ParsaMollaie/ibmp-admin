import { getCategories } from '@/services/category';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Image,
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

const CategoryPage: React.FC = () => {
  // State for modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.CategoryItem | null>(
    null,
  );

  // State for search
  const [searchTitle, setSearchTitle] = useState<string>('');

  // Fetch categories using useRequest hook
  // This automatically handles loading state and provides refresh function
  const {
    data: categoriesData,
    loading,
    refresh,
  } = useRequest(() => getCategories({ title: searchTitle || undefined }), {
    refreshDeps: [searchTitle],
  });

  // Extract the list from the response
  const categories = categoriesData?.data?.list || [];

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTitle(value);
  };

  // Handle create button click
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  // Handle edit button click
  const handleEdit = (record: API.CategoryItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Handle successful create
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('دسته‌بندی با موفقیت ایجاد شد');
    refresh();
  };

  // Handle successful update
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    message.success('دسته‌بندی با موفقیت ویرایش شد');
    refresh();
  };

  // Table columns definition
  const columns: ColumnsType<API.CategoryItem> = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
    },
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string | null) =>
        image ? (
          <Image
            src={image}
            alt="category"
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <span style={{ color: '#666' }}>—</span>
        ),
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'دسته والد',
      dataIndex: 'parent',
      key: 'parent',
      render: (parent: API.CategoryParent | null) =>
        parent ? (
          <Tag color="blue">{parent.title}</Tag>
        ) : (
          <Tag color="default">بدون والد</Tag>
        ),
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          مدیریت دسته‌بندی‌ها
        </Title>
        <Space>
          <Search
            placeholder="جستجو بر اساس عنوان..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            افزودن دسته‌بندی
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{
          total: categoriesData?.data?.pagination?.total || 0,
          pageSize: categoriesData?.data?.pagination?.page_size || 10,
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} دسته‌بندی`,
        }}
      />

      {/* Create Modal */}
      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        categories={categories}
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
        categories={categories}
      />
    </Card>
  );
};

export default CategoryPage;
