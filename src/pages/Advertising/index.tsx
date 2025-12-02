import { getAdvertisings } from '@/services/advertising';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

// Human-readable labels for section values (Persian)
const sectionLabels: Record<string, string> = {
  main_page_first_section: 'بخش اول صفحه اصلی',
  main_page_second_section: 'بخش دوم صفحه اصلی',
  main_page_third_section: 'بخش سوم صفحه اصلی',
};

const AdvertisingPage: React.FC = () => {
  // Reference to ProTable for manual refresh after create/update
  const actionRef = useRef<ActionType>();

  // Modal visibility states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);

  // Currently selected record for update
  const [currentRecord, setCurrentRecord] = useState<API.AdvertisingItem>();

  // Define table columns
  const columns: ProColumns<API.AdvertisingItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 80,
      search: false,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
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
              style={{ objectFit: 'cover' }}
            />
          );
        }
        return '-';
      },
    },
    {
      title: 'بخش',
      dataIndex: 'section',
      valueType: 'select',
      valueEnum: {
        main_page_first_section: { text: 'بخش اول صفحه اصلی' },
        main_page_second_section: { text: 'بخش دوم صفحه اصلی' },
        main_page_third_section: { text: 'بخش سوم صفحه اصلی' },
      },
      render: (_, record) => {
        return sectionLabels[record.section] || record.section;
      },
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      width: 80,
      search: false,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
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
    <React.Fragment>
      <ProTable<API.AdvertisingItem>
        headerTitle="مدیریت تبلیغات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const response = await getAdvertisings({
              title: params.title,
              section: params.section,
              status: params.status,
              page: params.current,
              page_size: params.pageSize,
            });

            return {
              data: response.data?.list || [],
              total: response.data?.pagination?.total || 0,
              success: response.success,
            };
          } catch (error) {
            // Debug log - see any errors
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
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            افزودن تبلیغ
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
    </React.Fragment>
  );
};

export default AdvertisingPage;
