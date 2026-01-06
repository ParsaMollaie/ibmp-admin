import { getUsers, updateUser } from '@/services/auth';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { message, Tag } from 'antd';
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

const UserTable: React.FC = () => {
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();

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
        request={async (params = {}) => {
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
