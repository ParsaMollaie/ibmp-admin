import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getCategoryTree } from '@/services/category';
import { deleteNews, getNewsList } from '@/services/news';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Image, message, Modal, Space, Tag, TreeSelect } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const buildTreeSelectOptions = (
  items: API.CategoryTreeItem[],
): { title: string; value: string; key: string; children?: any[] }[] => {
  return items.map((item) => ({
    title: item.title,
    value: String(item.code),
    key: String(item.code),
    children:
      item.children && item.children.length > 0
        ? buildTreeSelectOptions(item.children)
        : undefined,
  }));
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
  const formRef = useRef<any>();

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<API.NewsItem>();
  const [pageSize, setPageSize] = usePersistedPageSize('news', 10);
  const [categoryOptions, setCategoryOptions] = useState<
    { title: string; value: string; key: string; children?: any[] }[]
  >([]);

  useEffect(() => {
    getCategoryTree().then((res) => {
      setCategoryOptions(buildTreeSelectOptions(res.data || []));
    });

    // Read title query param from URL (e.g. navigated from news-comments page)
    const params = new URLSearchParams(history.location.search);
    const titleParam = params.get('title');
    if (titleParam) {
      formRef.current?.setFieldsValue({ title: titleParam });
      formRef.current?.submit();
    }
  }, []);

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
      title: 'دسته‌بندی',
      dataIndex: 'categories',
      width: 200,
      search: false,
      render: (_, record) =>
        record.categories && record.categories.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {record.categories.map((category) => (
              <Tag key={category.id}>{category.title}</Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category_codes',
      key: 'category_codes',
      hideInTable: true,
      renderFormItem: () => (
        <TreeSelect
          treeData={categoryOptions}
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_CHILD}
          showSearch
          treeNodeFilterProp="title"
          placeholder="انتخاب دسته‌بندی (چند انتخابی)"
          style={{ width: '100%' }}
          maxTagCount="responsive"
        />
      ),
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
    <PageContainer header={{ title: 'مدیریت مقالات و دانلود ها' }}>
      <ProTable<API.NewsItem>
        headerTitle="لیست مقالات"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        request={async (params, sort) => {
          try {
            const categoryCodes = Array.isArray(params.category_codes)
              ? params.category_codes
              : undefined;

            const response = await getNewsList({
              title: params.title,
              status: params.status,
              category_codes: categoryCodes,
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
          pageSize,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
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
