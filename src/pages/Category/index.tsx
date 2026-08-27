import { deleteCategory, getCategoryTree } from '@/services/category';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  PlusOutlined,
  TagOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Image, Modal, Space, Tag, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';
import './index.less';

const getStatusConfig = (
  status: 'active' | 'inactive' | undefined,
): { color: string; label: string } => {
  const statusMap: Record<string, { color: string; label: string }> = {
    active: { color: 'success', label: 'فعال' },
    inactive: { color: 'error', label: 'غیرفعال' },
  };
  return statusMap[status || 'active'] || { color: 'default', label: 'نامشخص' };
};

const addDepthToTree = (
  nodes: API.CategoryTreeItem[],
  depth = 0,
): (API.CategoryTreeItem & { _depth: number })[] =>
  nodes.map((node) => ({
    ...node,
    _depth: depth,
    ...(node.children?.length
      ? { children: addDepthToTree(node.children, depth + 1) }
      : {}),
  }));

const CategoryPage: React.FC = () => {
  const [treeData, setTreeData] = useState<API.CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.CategoryItem | null>(
    null,
  );

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCategoryTree();
      if (response.success) {
        setTreeData(addDepthToTree(response.data || []));
      }
    } catch (error) {
      console.error('Fetch category tree error:', error);
      message.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  const handleEdit = (record: API.CategoryTreeItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleDelete = (record: API.CategoryTreeItem) => {
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
      onOk: async () => {
        try {
          const response = await deleteCategory(record.id);
          if (response.success) {
            message.success('دسته‌بندی با موفقیت حذف شد');
            fetchTree();
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

  const handleSuccess = () => {
    setCreateModalVisible(false);
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    fetchTree();
  };

  const columns: ProColumns<API.CategoryTreeItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      hideInSearch: true,
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
      width: 250,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record: any) => {
        const depth = record._depth ?? 0;
        const hasChildren = record.children && record.children.length > 0;
        const icon =
          depth === 0 ? (
            <FolderOpenOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
          ) : hasChildren ? (
            <FolderOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
          ) : (
            <TagOutlined style={{ color: '#999', marginLeft: 8 }} />
          );
        return (
          <span style={{ fontWeight: depth === 0 ? 600 : 400 }}>
            {icon}
            {record.title}
          </span>
        );
      },
      sorter: (a, b) => a.title.localeCompare(b.title, 'fa'),
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      hideInSearch: true,
      render: (_, record: any) => {
        if (record._depth !== 0)
          return <span style={{ color: '#999' }}>—</span>;
        if (record.type === 'company') return <Tag color="blue">شرکتی</Tag>;
        if (record.type === 'engineers') return <Tag color="green">مهندسی</Tag>;
        return <span style={{ color: '#999' }}>—</span>;
      },
      sorter: (a, b) => {
        const rank: Record<string, number> = { company: 0, engineers: 1 };
        return (rank[a.type ?? ''] ?? 2) - (rank[b.type ?? ''] ?? 2);
      },
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      hideInSearch: true,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      sorter: (a, b) => {
        const rank: Record<string, number> = { active: 0, inactive: 1 };
        return rank[a.status] - rank[b.status];
      },
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.created_at) return '—';
        return new Date(record.created_at).toLocaleString('fa-IR');
      },
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
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
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
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

  return (
    <>
      <ProTable<API.CategoryTreeItem>
        headerTitle="مدیریت دسته‌بندی‌ها"
        rowKey="id"
        columns={columns}
        dataSource={treeData}
        loading={loading}
        search={false}
        pagination={false}
        expandable={{ defaultExpandAllRows: true, indentSize: 28 }}
        rowClassName={(record: any) => `category-depth-${record._depth ?? 0}`}
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
        options={{
          density: true,
          fullScreen: true,
          reload: () => {
            fetchTree();
          },
          setting: {
            listsHeight: 400,
          },
        }}
        scroll={{ x: 1200 }}
        dateFormatter="string"
        cardBordered
      />

      <CreateForm
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        onSuccess={handleSuccess}
      />

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
