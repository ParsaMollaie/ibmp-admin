import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getRoles } from '@/services/role';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import {
  KeyOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { Button, Card, message, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import PermissionsModal from './components/PermissionsModal';
import UpdateForm from './components/UpdateForm';

const RolePage: React.FC = () => {
  const access = useAccess();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.RoleItem | null>(null);

  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize('role', 20);

  const handleCreate = () => setCreateModalVisible(true);

  const handleEdit = (record: API.RoleItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  const handleManagePermissions = (record: API.RoleItem) => {
    setCurrentRecord(record);
    setPermissionsModalVisible(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('نقش با موفقیت ایجاد شد');
    actionRef.current?.reload();
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    message.success('نقش با موفقیت ویرایش شد');
    actionRef.current?.reload();
  };

  const handlePermissionsSuccess = () => {
    setPermissionsModalVisible(false);
    setCurrentRecord(null);
    message.success('دسترسی‌های نقش با موفقیت بروزرسانی شد');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.RoleItem>[] = [
    {
      title: 'نام نقش',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: true,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      search: false,
      render: (_, record) =>
        record.title || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'تعداد دسترسی‌ها',
      dataIndex: 'permissions_count',
      key: 'permissions_count',
      width: 130,
      search: false,
      render: (_, record) => (
        <Tag color="blue">{record.permissions_count ?? 0}</Tag>
      ),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      search: false,
      sorter: true,
      render: (_, record) =>
        record.created_at
          ? convertEnDateToFaDate(record.created_at).format('YYYY/MM/DD HH:mm')
          : '—',
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 140,
      search: false,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {access.hasPermission('roles:update') && (
            <Button
              type="text"
              icon={<KeyOutlined />}
              title="ویرایش نقش"
              onClick={() => handleEdit(record)}
            />
          )}
          {access.hasPermission('role-permissions:update') && (
            <Button
              type="text"
              icon={<SafetyCertificateOutlined />}
              title="مدیریت دسترسی‌ها"
              onClick={() => handleManagePermissions(record)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <ProTable<API.RoleItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params) => {
          const { name, current, pageSize: size } = params;

          const response = await getRoles({
            search: name || undefined,
            page: current,
            page_size: size,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        toolbar={{
          title: 'مدیریت نقش‌ها و دسترسی‌ها',
          actions: access.hasPermission('roles:create')
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  افزودن نقش
                </Button>,
              ]
            : [],
        }}
        search={{
          labelWidth: 'auto',
          searchText: 'جستجو',
          resetText: 'بازنشانی',
        }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          showTotal: (total) => `مجموع: ${total} نقش`,
        }}
        scroll={{ x: 900 }}
        dateFormatter="string"
        headerTitle={false}
      />

      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <UpdateForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleUpdateSuccess}
        record={currentRecord}
      />

      <PermissionsModal
        visible={permissionsModalVisible}
        onCancel={() => {
          setPermissionsModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handlePermissionsSuccess}
        record={currentRecord}
      />
    </Card>
  );
};

export default RolePage;
