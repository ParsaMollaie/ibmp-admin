import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { deleteAdvertising, getAdvertisings } from '@/services/advertising';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Modal, Space, Tag } from 'antd';
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
  const [pageSize, setPageSize] = usePersistedPageSize('advertising', 10);

  const handleDelete = (record: API.AdvertisingItem) => {
    Modal.confirm({
      title: 'حذف تبلیغ',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف تبلیغ زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.title}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteAdvertising(record.id);
          if (response.success) {
            message.success('تبلیغ با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف تبلیغ');
          }
        } catch (error) {
          console.error('Delete advertising error:', error);
          message.error('خطا در ارتباط با سرور');
        }
      },
    });
  };

  // Define table columns
  const columns: ProColumns<API.AdvertisingItem>[] = [
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
      sorter: true,
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
      width: 150,
      search: false,
      sorter: true,
      render: (_, record) =>
        convertEnDateToFaDate(record.created_at).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      width: 150,
      search: false,
      sorter: true,
      render: (_, record) =>
        convertEnDateToFaDate(record.updated_at).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: 'ایجاد شده توسط',
      dataIndex: 'created_by',
      width: 130,
      search: false,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      width: 130,
      search: false,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
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
            <a
              style={{ color: '#ff4d4f' }}
              onClick={() => handleDelete(record)}
            >
              حذف
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
        request={async (params, sort) => {
          try {
            const response = await getAdvertisings({
              title: params.title,
              section: params.section,
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
          pageSize,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
        }}
        scroll={{ x: 1100 }}
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
