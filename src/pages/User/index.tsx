import { getUsers, updateUser } from '@/services/auth';
import { ExportColumn, exportToExcel } from '@/utils/exportExcel';
import { DownloadOutlined } from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';
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
      first_name: fields.first_name,
      last_name: fields.last_name,
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

const UserTable: React.FC = () => {
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const [filterParams, setFilterParams] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);
  const actionRef = useRef<ActionType>();

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
      title: 'نام کاربری',
      dataIndex: 'username',
    },
    {
      title: 'نام',
      dataIndex: 'first_name',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'last_name',
    },
    {
      title: 'ایمیل',
      dataIndex: 'email',
    },
    {
      title: 'تاریخ آخرین بروزرسانی',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      search: false,
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
    },

    {
      title: 'عملیات',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <>
          <a
            onClick={() => {
              handleUpdateModalVisible(true);
              setStepFormValues({
                id: record.id,
                first_name: record.first_name,
                last_name: record.last_name,
              });
            }}
          >
            ویرایش
          </a>
        </>
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
        request={async (params = {}) => {
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
        pagination={{
          pageSize: 10,
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
    </PageContainer>
  );
};

export default UserTable;
