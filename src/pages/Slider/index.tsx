import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { deleteSlider, getSliders } from '@/services/auth';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Image, message, Modal, Tag } from 'antd';
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
  const [pageSize, setPageSize] = usePersistedPageSize('slider', 10);

  const handleDelete = (record: API.SliderItem) => {
    Modal.confirm({
      title: 'حذف اسلایدر',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف اسلایدر زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.title}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteSlider(record.id);
          if (response.success) {
            message.success('اسلایدر با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف اسلایدر');
          }
        } catch (error) {
          console.error('Delete slider error:', error);
          message.error('خطا در ارتباط با سرور');
        }
      },
    });
  };

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
      sorter: true,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      render: () => <Tag color="green">{'اصلی'}</Tag>,
      filters: [
        { text: 'اصلی', value: 'main' },
        { text: 'ثانویه', value: 'secondary' },
      ],
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
      sorter: true,
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
      title: 'تاریخ شروع نمایش',
      dataIndex: 'publish_at',
      search: false,
      sorter: true,
      width: 150,
      render: (_, record) =>
        record.publish_at
          ? convertEnDateToFaDate(record.publish_at).format('YYYY/MM/DD HH:mm')
          : '—',
    },
    {
      title: 'تاریخ پایان نمایش',
      dataIndex: 'end_date',
      search: false,
      sorter: true,
      width: 150,
      render: (_, record) =>
        record.end_date
          ? convertEnDateToFaDate(record.end_date).format('YYYY/MM/DD HH:mm')
          : '—',
    },

    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      sorter: true,
      search: false,
      width: 150,
      render: (_, record) =>
        convertEnDateToFaDate(record.created_at).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      search: false,
      width: 150,
      sorter: true,
      render: (_, record) =>
        convertEnDateToFaDate(record.updated_at).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: 'ایجاد شده توسط',
      dataIndex: 'created_by',
      search: false,
      width: 130,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      search: false,
      width: 130,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
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
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => handleDelete(record)}
        >
          حذف
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
            ...filter,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
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
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_current, size) => setPageSize(size),
        }}
        scroll={{ x: 1000 }}
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
