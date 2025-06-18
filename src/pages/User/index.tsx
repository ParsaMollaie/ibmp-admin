import { addUser, getUsers, updateUser } from '@/services/auth';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Divider, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

const handleAdd = async (fields: API.UserInfo) => {
  const hide = message.loading('در حال افزودن');
  try {
    await addUser({
      username: fields.username,
      password: fields.password,
      user_type: fields.user_type,
      email: fields.email || '',
      first_name: fields.first_name || '',
      last_name: fields.last_name || '',
      avatar: null,
    });
    hide();
    message.success('افزودن موفقیت آمیز بود');
    return true;
  } catch (error) {
    hide();
    message.error('افزودن انجام نشد، لطفا مجددا تلاش کنید');
    console.log(error);
    return false;
  }
};

const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('در حال به روز رسانی');
  try {
    if (!fields.id) throw new Error('شناسه کاربر نامعتبر است');

    await updateUser(fields.id, {
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

const handleRemove = async (selectedRows: API.UserInfo[]) => {
  const hide = message.loading('در حال حذف');
  if (!selectedRows) return true;
  try {
    // TODO: Replace with actual API call when you have the endpoint
    // await deleteUserAPI(selectedRows.find((row) => row.id)?.id || '');
    hide();
    message.success('حذف موفقیت آمیز بود');
    return true;
  } catch (error) {
    hide();
    message.error('حذف انجام نشد، لطفا مجددا تلاش کنید');
    return false;
  }
};

const UserTable: React.FC = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<API.UserInfo[]>([]);

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
      render: (_, record) => (
        <Tag color={record.user_type === 'admin' ? 'red' : 'green'}>
          {record.user_type}
        </Tag>
      ),
      valueEnum: {
        admin: { text: 'مدیر' },
        user: { text: 'کاربر' },
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
          <Divider type="vertical" />
          <a
            onClick={async () => {
              await handleRemove([record]);
              actionRef.current?.reload();
            }}
          >
            حذف
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
            key="1"
            type="primary"
            onClick={() => handleModalVisible(true)}
          >
            افزودن کاربر
          </Button>,
        ]}
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
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
        pagination={{
          pageSize: 10,
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              انتخاب شده{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a> مورد
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            حذف گروهی
          </Button>
        </FooterToolbar>
      )}
      <CreateForm
        onCancel={() => handleModalVisible(false)}
        modalVisible={createModalVisible}
      >
        <ProTable<API.UserInfo, API.UserInfo>
          onSubmit={async (value) => {
            const success = await handleAdd({
              ...value,
              // Ensure all required fields are included
              username: value.username || '',
              email: value.email || '',
              first_name: value.first_name || '',
              last_name: value.last_name || '',
              user_type: value.user_type,
            });
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="id"
          type="form"
          columns={[
            {
              title: 'نام کاربری',
              dataIndex: 'username',
              formItemProps: {
                rules: [{ required: true, message: 'نام کاربری الزامی است' }],
              },
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
              formItemProps: {
                rules: [
                  { required: true, message: 'ایمیل الزامی است' },
                  { type: 'email', message: 'ایمیل معتبر نیست' },
                ],
              },
            },
            {
              title: 'رمز عبور',
              dataIndex: 'password',
              valueType: 'password',
              formItemProps: {
                rules: [
                  { required: true, message: 'رمز عبور الزامی است' },
                  { min: 8, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
                ],
              },
            },
            {
              title: 'نوع کاربر',
              dataIndex: 'user_type',
              valueEnum: {
                admin: { text: 'مدیر' },
                client: { text: 'کاربر عادی' },
              },
              formItemProps: {
                rules: [{ required: true, message: 'نوع کاربر الزامی است' }],
              },
            },
          ]}
        />
      </CreateForm>
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
