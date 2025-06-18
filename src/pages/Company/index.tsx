import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Divider, Drawer, message } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm, { FormValueType } from './components/UpdateForm';

// Mock functions to replace API calls
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockAddCompany = async (fields: API.CompanyInfo) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockQueryCompanyList = async (params: any) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: {
      list: Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        code: 1000 + i,
        title: `شرکت ${i}`,
        description: `توضیحات شرکت ${i}`,
        color: ['قرمز', 'آبی', 'سبز', 'زرد'][i % 4],
        type: ['نوع ۱', 'نوع ۲', 'نوع ۳'][i % 3],
        status: ['فعال', 'غیرفعال', 'در حال بررسی'][i % 3],
        for: `کاربرد ${i}`,
        image: `https://picsum.photos/100/100?random=${i}`,
        preview: `پیش نمایش ${i}`,
        startDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: new Date(
          Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAt: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        creator: `کاربر ${(i % 5) + 1}`,
        updatedBy: `کاربر ${(i % 3) + 1}`,
      })),
      total: 20,
    },
    success: true,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockModifyCompany = async (id: string, fields: any) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockDeleteCompany = async (id: string) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 800));
  return true;
};

/**
 * 添加节点
 * @param fields
 */
const handleAdd = async (fields: API.CompanyInfo) => {
  const hide = message.loading('در حال افزودن');
  try {
    await mockAddCompany({ ...fields });
    hide();
    message.success('افزودن موفقیت آمیز بود');
    return true;
  } catch (error) {
    hide();
    message.error('افزودن انجام نشد، لطفا مجددا تلاش کنید');
    return false;
  }
};

/**
 * 更新节点
 * @param fields
 */
const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('در حال به روز رسانی');
  try {
    await mockModifyCompany(fields.id || '', {
      title: fields.title || '',
      description: fields.description || '',
      type: fields.type || '',
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

/**
 *  删除节点
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.CompanyInfo[]) => {
  const hide = message.loading('در حال حذف');
  if (!selectedRows) return true;
  try {
    await mockDeleteCompany(selectedRows.find((row) => row.id)?.id || '');
    hide();
    message.success('حذف موفقیت آمیز بود');
    return true;
  } catch (error) {
    hide();
    message.error('حذف انجام نشد، لطفا مجددا تلاش کنید');
    return false;
  }
};

const CompanyList: React.FC<unknown> = () => {
  const [createModalVisible, handleModalVisible] = useState<boolean>(false);
  const [updateModalVisible, handleUpdateModalVisible] =
    useState<boolean>(false);
  const [stepFormValues, setStepFormValues] = useState({});
  const actionRef = useRef<ActionType>();
  const [row, setRow] = useState<API.CompanyInfo>();
  const [selectedRowsState, setSelectedRows] = useState<API.CompanyInfo[]>([]);

  const columns: ProColumns<API.CompanyInfo>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      valueType: 'digit',
      width: 80,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      formItemProps: {
        rules: [
          {
            required: true,
            message: 'عنوان الزامی است',
          },
        ],
      },
    },
    {
      title: 'توضیحات',
      dataIndex: 'description',
      valueType: 'textarea',
      search: false,
    },
    {
      title: 'رنگ',
      dataIndex: 'color',
      search: false,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      valueEnum: {
        'نوع ۱': { text: 'نوع ۱' },
        'نوع ۲': { text: 'نوع ۲' },
        'نوع ۳': { text: 'نوع ۳' },
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      valueEnum: {
        فعال: { text: 'فعال', status: 'Success' },
        غیرفعال: { text: 'غیرفعال', status: 'Error' },
        'در حال بررسی': { text: 'در حال بررسی', status: 'Processing' },
      },
    },
    {
      title: 'برای',
      dataIndex: 'for',
      search: false,
    },
    {
      title: 'عکس',
      dataIndex: 'image',
      search: false,
      render: (text) => (
        <img
          src={text as string}
          alt="company"
          style={{ width: 50, height: 50 }}
        />
      ),
    },
    {
      title: 'پیش نمایش',
      dataIndex: 'preview',
      search: false,
    },
    {
      title: 'تاریخ شروع',
      dataIndex: 'startDate',
      valueType: 'date',
    },
    {
      title: 'تاریخ پایان',
      dataIndex: 'endDate',
      valueType: 'date',
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'createdAt',
      valueType: 'date',
      search: false,
    },
    {
      title: 'ایجاد کننده',
      dataIndex: 'creator',
      search: false,
    },
    {
      title: 'به روز شده توسط',
      dataIndex: 'updatedBy',
      search: false,
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
              setStepFormValues(record);
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
        title: 'لیست شرکت ها',
      }}
    >
      <ProTable<API.CompanyInfo>
        headerTitle="جدول شرکت ها"
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
            افزودن شرکت
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          const { data, success } = await mockQueryCompanyList({
            ...params,
            sorter,
            filter,
          });
          return {
            data: data?.list || [],
            success,
            total: data?.total || 0,
          };
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
        <ProTable<API.CompanyInfo, API.CompanyInfo>
          onSubmit={async (value) => {
            const success = await handleAdd(value);
            if (success) {
              handleModalVisible(false);
              if (actionRef.current) {
                actionRef.current.reload();
              }
            }
          }}
          rowKey="id"
          type="form"
          columns={columns.filter(
            (item) => !['option', 'image'].includes(item.dataIndex as string),
          )}
        />
      </CreateForm>
      {stepFormValues && Object.keys(stepFormValues).length ? (
        <UpdateForm
          onSubmit={async (value) => {
            const success = await handleUpdate(value);
            if (success) {
              handleUpdateModalVisible(false);
              setStepFormValues({});
              if (actionRef.current) {
                actionRef.current.reload();
              }
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

      <Drawer
        width={600}
        open={!!row}
        onClose={() => {
          setRow(undefined);
        }}
        closable={false}
      >
        {row?.title && (
          <ProDescriptions<API.CompanyInfo>
            column={2}
            title={row?.title}
            request={async () => ({
              data: row || {},
            })}
            params={{
              id: row?.title,
            }}
            columns={columns}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default CompanyList;
