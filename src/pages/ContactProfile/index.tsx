import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { generateUserToken } from '@/services/auth';
import {
  deleteContactProfile,
  getContactProfiles,
} from '@/services/contact-profile';
import {
  DeleteOutlined,
  EditOutlined,
  LoginOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Space, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const CLIENT_APP_URL = process.env.UMI_APP_CLIENT_URL || 'https://ibmp.ir';

const ContactProfilePage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pageSize, setPageSize] = usePersistedPageSize('contact-profile', 10);
  const [currentRecord, setCurrentRecord] =
    useState<API.ContactProfileItem | null>(null);

  // Handle edit
  const handleEdit = (record: API.ContactProfileItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Handle successful create/update
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    actionRef.current?.reload();
  };

  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // Handle impersonate (login as the client linked to this profile)
  const handleImpersonate = async (userId: string) => {
    const hide = message.loading('در حال دریافت توکن...');
    try {
      const response = await generateUserToken(userId);
      hide();
      if (response.success && response.data?.access_token) {
        window.open(
          `${CLIENT_APP_URL}/impersonate?token=${encodeURIComponent(
            response.data.access_token,
          )}`,
          '_blank',
        );
      } else {
        message.error('خطا در دریافت توکن کاربر');
      }
    } catch (error) {
      hide();
      message.error('خطا در ورود به حساب کاربر');
    }
  };

  // Handle delete action with confirmation
  const handleDelete = (record: API.ContactProfileItem) => {
    Modal.confirm({
      title: 'حذف پروفایل تماس',
      content: `آیا از حذف پروفایل "${record.title}" اطمینان دارید؟`,
      okText: 'بله، حذف شود',
      cancelText: 'انصراف',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(record.id);
        try {
          const response = await deleteContactProfile(record.id);
          if (response.success) {
            message.success('پروفایل تماس با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف پروفایل تماس');
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
  const columns: ProColumns<API.ContactProfileItem>[] = [
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      fieldProps: {
        placeholder: 'جستجوی عنوان',
      },
      sorter: true,
    },
    {
      title: 'ایمیل',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.email || '—',
      sorter: true,
    },
    {
      title: 'کاربر',
      dataIndex: 'user',
      key: 'user',
      width: 180,
      hideInSearch: true,
      render: (_, record) =>
        record.user
          ? `${record.user.first_name} ${record.user.last_name}`
          : '—',
    },
    {
      title: 'تعداد خدمات',
      dataIndex: 'services_count',
      key: 'services_count',
      width: 120,
      hideInSearch: true,
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
      width: 120,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="ویرایش">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          {record.user?.user_type === 'client' && (
            <Tooltip title="ورود به حساب">
              <Button
                type="text"
                icon={<LoginOutlined />}
                onClick={() => handleImpersonate(record.user!.id)}
              />
            </Tooltip>
          )}

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
      <ProTable<API.ContactProfileItem>
        headerTitle="مدیریت اطلاعات تماس"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            افزودن پروفایل تماس
          </Button>,
        ]}
        request={async (params, sort) => {
          const response = await getContactProfiles({
            search: params.title,
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
            `نمایش ${range[0]}-${range[1]} از ${total} پروفایل`,
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
        scroll={{ x: 1000 }}
        dateFormatter="string"
        cardBordered
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
    </>
  );
};

export default ContactProfilePage;
