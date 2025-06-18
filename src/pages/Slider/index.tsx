import { getSliders } from '@/services/auth';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Image, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const SliderTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<API.SliderItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<API.SliderItem | null>(
    null,
  );

  const columns: ProColumns<API.SliderItem>[] = [
    {
      title: 'اولویت',
      dataIndex: 'priority',
      sorter: true,
      width: 80,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      render: () => <Tag color="green">{'اصلی'}</Tag>,
      filters: [
        { text: 'اصلی', value: 'main' },
        { text: 'ثانویه', value: 'secondary' },
      ],
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
      title: 'تصویر',
      dataIndex: 'image',
      render: (_, record) =>
        record.image ? (
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
        ) : (
          <Tag>بدون تصویر</Tag>
        ),
      search: false,
    },
    {
      title: 'تصویر پرتره',
      dataIndex: 'portrait_image',
      render: (_, record) =>
        record.portrait_image ? (
          <Image
            src={record.portrait_image}
            alt={record.alt_image}
            width={50}
            height={80}
            style={{ objectFit: 'cover' }}
            preview={{
              src: record.portrait_image,
            }}
          />
        ) : (
          <Tag>بدون تصویر</Tag>
        ),
      search: false,
    },

    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      sorter: true,
      search: false,
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentSlider(record);
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
      <ProTable<API.SliderItem>
        headerTitle="لیست اسلایدرها"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
        }}
        request={async (params = {}, sort, filter) => {
          const response = await getSliders({
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
            افزودن اسلایدر جدید
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

      {currentSlider && (
        <UpdateForm
          visible={updateModalVisible}
          onCancel={() => {
            setUpdateModalVisible(false);
            setCurrentSlider(null);
          }}
          onSuccess={() => {
            setUpdateModalVisible(false);
            setCurrentSlider(null);
            actionRef.current?.reload();
          }}
          initialValues={currentSlider}
        />
      )}
    </PageContainer>
  );
};

export default SliderTable;
