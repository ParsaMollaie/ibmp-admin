import { getBusinessPartners } from '@/services/business-partners';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const BusinessPartnersPage: React.FC = () => {
  // Reference to ProTable for manual refresh after create/update
  const actionRef = useRef<ActionType>();

  // Modal visibility states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);

  // Currently selected record for update
  const [currentRecord, setCurrentRecord] = useState<API.BusinessPartnerItem>();

  // Define table columns
  const columns: ProColumns<API.BusinessPartnerItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'تصویر',
      dataIndex: 'image',
      search: false,
      width: 100,
      render: (_, record) => {
        if (record.image) {
          return (
            <Image
              src={record.image}
              width={60}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          );
        }
        return <span>-</span>;
      },
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      sorter: true,
      valueEnum: {
        active: { text: 'فعال', status: 'Success' },
        inactive: { text: 'غیرفعال', status: 'Default' },
      },
      render: (_, record) => {
        return (
          <Tag color={record.status === 'active' ? 'green' : 'default'}>
            {record.status === 'active' ? 'فعال' : 'غیرفعال'}
          </Tag>
        );
      },
    },
    {
      title: 'لینک',
      dataIndex: 'link',
      ellipsis: true,
      search: false,
      render: (_, record) => {
        return (
          <a href={record.link} target="_blank" rel="noopener noreferrer">
            {record.link}
          </a>
        );
      },
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 150,
      search: false,
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      width: 150,
      search: false,
      sorter: true,
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 100,
      render: (_, record) => {
        return (
          <Space>
            <a
              onClick={() => {
                setCurrentRecord(record);
                setUpdateModalOpen(true);
              }}
            >
              ویرایش
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer header={{ title: 'مدیریت شرکای تجاری' }}>
      <ProTable<API.BusinessPartnerItem>
        headerTitle="لیست شرکای تجاری"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params, sort) => {
          try {
            const response = await getBusinessPartners({
              title: params.title,
              status: params.status,
              page: params.current,
              page_size: params.pageSize,
              sorter:
                sort && Object.keys(sort).length
                  ? JSON.stringify(sort)
                  : undefined,
            });

            return {
              data: response.data?.list || [],
              total: response.data?.pagination?.total || 0,
              success: response.success,
            };
          } catch (error) {
            message.error('خطا در دریافت اطلاعات');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        scroll={{ x: 1000 }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            افزودن شریک تجاری
          </Button>,
        ]}
      />

      <CreateForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false);
          actionRef.current?.reload();
        }}
      />

      <UpdateForm
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        record={currentRecord}
        onSuccess={() => {
          setUpdateModalOpen(false);
          setCurrentRecord(undefined);
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default BusinessPartnersPage;
