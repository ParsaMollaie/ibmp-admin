import { getNewsList } from '@/services/auth';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Image, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const { Paragraph } = Typography;

const NewsTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<API.NewsItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<API.NewsItem | null>(null);

  const columns: ProColumns<API.NewsItem>[] = [
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'خلاصه',
      dataIndex: 'summary',
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
          {text}
        </Paragraph>
      ),
      search: false,
    },
    {
      title: 'تصویر',
      dataIndex: 'image',
      render: (_, record) => (
        <Image
          src={record.image}
          alt={record.alt_image}
          width={80}
          height={50}
          style={{ objectFit: 'cover' }}
          preview={{
            src: record.image,
          }}
        />
      ),
      search: false,
    },
    {
      title: 'تاریخ انتشار',
      dataIndex: 'publish_at',
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
      filters: [
        { text: 'فعال', value: 'active' },
        { text: 'غیرفعال', value: 'inactive' },
      ],
    },
    {
      title: 'تعداد بازدید',
      dataIndex: 'views_count',
      search: false,
    },
    {
      title: 'زمان مطالعه',
      dataIndex: 'study_time',
      search: false,
      render: (text) => `${text} دقیقه`,
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentItem(record);
            setUpdateModalVisible(true);
          }}
        >
          ویرایش
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.NewsItem>
        headerTitle="لیست اخبار"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
        }}
        request={async (params = {}, sort, filter) => {
          const response = await getNewsList({
            ...params,
            ...sort,
            ...filter,
          });
          return {
            data: response.data.list,
            success: response.success,
            total: response.data.pagination.total,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            افزودن خبر جدید
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {selectedRows?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              انتخاب شده{' '}
              <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> مورد
            </div>
          }
        ></FooterToolbar>
      )}

      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
      />

      {currentItem && (
        <UpdateForm
          visible={updateModalVisible}
          onCancel={() => {
            setUpdateModalVisible(false);
            setCurrentItem(null);
          }}
          onSuccess={() => {
            setUpdateModalVisible(false);
            setCurrentItem(null);
            actionRef.current?.reload();
          }}
          initialValues={currentItem}
        />
      )}
    </PageContainer>
  );
};

export default NewsTable;
