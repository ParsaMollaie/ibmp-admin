import { generateUserToken, getUsers, updateUser } from '@/services/auth';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExportColumn, exportToExcel } from '@/utils/exportExcel';
import {
  DownloadOutlined,
  KeyOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import ChangePasswordForm from './components/ChangePasswordForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('در حال به روز رسانی');

  // Store id in a const - this helps TypeScript narrow the type
  const id = fields.id;

  if (!id) {
    hide();
    message.error('شناسه کاربر نامعتبر است');
    return false;
  }

  try {
    await updateUser(id, {
      username: fields.username,
      first_name: fields.first_name,
      last_name: fields.last_name,
      email: fields.email,
      job_position: fields.job_position,
    });

    hide();
    message.success('به روز رسانی موفقیت آمیز بود');
    return true;
  } catch (error) {
    hide();
    message.error('به روز رسانی انجام نشد، لطفا مجددا تلاش کنید');
    return false;
  }
};

// Export column definitions with Persian headers
const exportColumns: ExportColumn[] = [
  { title: 'نام کاربری', dataIndex: 'username' },
  { title: 'نام', dataIndex: 'first_name' },
  { title: 'نام خانوادگی', dataIndex: 'last_name' },
  { title: 'ایمیل', dataIndex: 'email' },
  {
    title: 'نوع کاربر',
    dataIndex: 'user_type',
    render: (value) => (value === 'admin' ? 'ادمین' : 'کاربر'),
  },
];

const CLIENT_APP_URL = process.env.UMI_APP_CLIENT_URL || 'https://ibmp.ir';

const UserTable: React.FC = () => {
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const actionRef = useRef<ActionType>();

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

  // Handle export to Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await getUsers({
        ...filterParams,
        page: 1,
        page_size: 99999, // Fetch all filtered data
      });

      if (response.success && response.data.list.length > 0) {
        exportToExcel(response.data.list, exportColumns, 'users');
        message.success('فایل اکسل با موفقیت دانلود شد');
      } else {
        message.warning('داده‌ای برای دانلود وجود ندارد');
      }
    } catch (error) {
      message.error('خطا در دانلود فایل اکسل');
    } finally {
      setExporting(false);
    }
  };

  const columns: ProColumns<API.UserInfo>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 70,
      fieldProps: {
        placeholder: 'کد',
      },
      sorter: true,
    },
    {
      title: 'نام کاربری',
      dataIndex: 'username',
      fieldProps: {
        placeholder: 'نام کاربری را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'نام',
      dataIndex: 'first_name',
      fieldProps: {
        placeholder: 'نام را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'last_name',
      fieldProps: {
        placeholder: 'نام خانوادگی را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'ایمیل',
      dataIndex: 'email',
      fieldProps: {
        placeholder: 'ایمیل را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'سمت شغلی',
      dataIndex: 'job_position',
      render: (_, record) =>
        record.job_position || <span style={{ color: '#999' }}>—</span>,
      fieldProps: {
        placeholder: 'سمت شغلی را وارد کنید',
      },
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      search: false,
      width: 150,
      sorter: true,
      render: (_, record) =>
        record.created_at
          ? convertEnDateToFaDate(record.created_at).format('YYYY/MM/DD HH:mm')
          : '—',
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      search: false,
      width: 150,
      sorter: true,
      render: (_, record) =>
        record.updated_at
          ? convertEnDateToFaDate(record.updated_at).format('YYYY/MM/DD HH:mm')
          : '—',
    },
    {
      title: 'ایجاد شده توسط',
      dataIndex: 'created_by',
      search: false,
      width: 130,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      search: false,
      width: 130,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
    },
    {
      title: 'نوع کاربر',
      dataIndex: 'user_type',
      render: (_, record) => {
        const isAdmin = record.user_type === 'admin';

        return (
          <Tag color={isAdmin ? 'red' : 'green'}>
            {isAdmin ? 'ادمین' : 'کاربر'}
          </Tag>
        );
      },
      valueEnum: {
        admin: { text: 'ادمین' },
        client: { text: 'کاربر' },
      },
      sorter: true,
    },

    {
      title: 'عملیات',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              handleUpdateModalVisible(true);
              setStepFormValues(record);
            }}
          >
            ویرایش
          </a>
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={() => {
              setPasswordUserId(record.id);
              setPasswordModalVisible(true);
            }}
          >
            تغییر رمز
          </Button>
          {record.user_type === 'client' && (
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => handleImpersonate(record.id)}
            >
              ورود به حساب
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'مدیریت کاربران',
      }}
    >
      <ProTable<API.UserInfo>
        headerTitle="لیست کاربران"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          syncToUrl: true,
        }}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            دانلود اکسل
          </Button>,
        ]}
        request={async (params = {}, sort) => {
          // Store filter params for export (excluding pagination params)
          const filters = Object.fromEntries(
            Object.entries(params).filter(
              ([key]) => !['current', 'pageSize'].includes(key),
            ),
          );
          setFilterParams(filters);

          try {
            const response = await getUsers({
              ...params,
              page: params.current,
              page_size: params.pageSize,
              sorter:
                sort && Object.keys(sort).length
                  ? JSON.stringify(sort)
                  : undefined,
            });

            return {
              data: response.data.list,
              success: response.success,
              total: response.data.pagination.total,
            };
          } catch (error) {
            message.error('خطا در دریافت لیست کاربران');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />

      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              actionRef.current?.reload();
            }
          }}
          onCancel={() => {
            handleUpdateModalVisible(false);
            setStepFormValues({});
          }}
          updateModalVisible={updateModalVisible}
          values={stepFormValues}
        />
      ) : null}

      <ChangePasswordForm
        visible={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          setPasswordUserId(null);
        }}
        onSuccess={() => {
          setPasswordModalVisible(false);
          setPasswordUserId(null);
          actionRef.current?.reload();
        }}
        userId={passwordUserId}
      />
    </PageContainer>
  );
};

export default UserTable;
