import { getNewsList } from '@/services/news';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Space, Tag } from 'antd';
import moment from 'jalali-moment';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

// Helper function to convert Gregorian date to Jalali (Persian) format
const toJalali = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    return moment(dateString).locale('fa').format('jYYYY/jMM/jDD HH:mm');
  } catch {
    return dateString;
  }
};

// Helper function to convert Gregorian date to Jalali (Persian) format - date only
const toJalaliDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    return moment(dateString).locale('fa').format('jYYYY/jMM/jDD');
  } catch {
    return dateString;
  }
};

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

  const columns: ProColumns<API.NewsItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 70,
      search: false,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
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
    },
    {
      title: 'زمان مطالعه (دقیقه)',
      dataIndex: 'study_time',
      width: 120,
      search: false,
    },
    {
      title: 'تاریخ انتشار',
      dataIndex: 'publish_at',
      width: 130,
      search: false,
      render: (_, record) => {
        return <span>{toJalaliDate(record.publish_at)}</span>;
      },
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
      title: 'بازدید',
      dataIndex: 'views_count',
      width: 80,
      search: false,
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      width: 150,
      search: false,
      render: (_, record) => {
        return <span>{toJalali(record.created_at)}</span>;
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
    <PageContainer header={{ title: 'مدیریت اخبار' }}>
      <ProTable<API.NewsItem>
        headerTitle="لیست اخبار"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params) => {
          try {
            const response = await getNewsList({
              title: params.title,
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
