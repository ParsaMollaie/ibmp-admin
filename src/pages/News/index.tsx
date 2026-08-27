import { deleteNews, getNewsList } from '@/services/news';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Modal, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

// Strip HTML tags for plain-text display
const stripHtml = (html: string): string => {
  if (!html) return '-';
  return (
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim() || '-'
  );
};

const NewsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<API.NewsItem>();

  const handleDelete = (record: API.NewsItem) => {
    Modal.confirm({
      title: 'حذف مقاله',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف مقاله زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.title}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteNews(record.id);
          if (response.success) {
            message.success('مقاله با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف مقاله');
          }
        } catch (error) {
          console.error('Delete news error:', error);
          message.error('خطا در ارتباط با سرور');
        }
      },
    });
  };

  const columns: ProColumns<API.NewsItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 70,
      search: false,
      fixed: 'left', // Fix code column for better mobile navigation
      sorter: true,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
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
      title: 'خلاصه',
      dataIndex: 'summary',
      ellipsis: true,
      width: 200,
      search: false,
      render: (_, record) => <span>{stripHtml(record.summary)}</span>,
      sorter: true,
    },
    {
      title: 'زمان مطالعه (دقیقه)',
      dataIndex: 'study_time',
      width: 120,
      search: false,
      sorter: true,
    },
    {
      title: 'تاریخ انتشار',
      dataIndex: 'publish_at',
      width: 130,
      search: false,
      render: (_, record) => {
        return (
          <span>
            {convertEnDateToFaDate(record.publish_at).format('YYYY/MM/DD')}
          </span>
        );
      },
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
      title: 'بازدید',
      dataIndex: 'views_count',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      width: 150,
      search: false,
      render: (_, record) => {
        return (
          <span>
            {convertEnDateToFaDate(record.created_at).format(
              'YYYY/MM/DD HH:mm',
            )}
          </span>
        );
      },
      sorter: true,
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      width: 150,
      search: false,
      render: (_, record) => {
        if (!record.updated_at) return '—';
        return (
          <span>
            {convertEnDateToFaDate(record.updated_at).format(
              'YYYY/MM/DD HH:mm',
            )}
          </span>
        );
      },
      sorter: true,
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
      key: 'actions',
      valueType: 'option',
      width: 100,
      fixed: 'right', // Fix actions column to right like Category table
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
    <PageContainer header={{ title: 'مدیریت مقالات' }}>
      <ProTable<API.NewsItem>
        headerTitle="لیست مقالات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params, sort) => {
          try {
            const response = await getNewsList({
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
        // Add scroll configuration for horizontal scrolling on mobile
        scroll={{ x: 1500 }}
        // Add options similar to Category table for better UX
        options={{
          density: true,
          fullScreen: true,
          reload: () => {
            actionRef.current?.reload();
          },
          setting: {
            listsHeight: 400,
          },
        }}
        // Add card bordered for consistent styling with Category table
        cardBordered
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            افزودن خبر
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

export default NewsPage;
