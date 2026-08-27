import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { deleteSocialNetwork, getSocialNetworks } from '@/services/auth';
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

const SocialNetworkTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<API.SocialNetworkItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<API.SocialNetworkItem | null>(
    null,
  );
  const [pageSize, setPageSize] = usePersistedPageSize('social-networks', 10);

  const handleDelete = (record: API.SocialNetworkItem) => {
    Modal.confirm({
      title: 'حذف شبکه اجتماعی',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف شبکه اجتماعی زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.social}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteSocialNetwork(record.id);
          if (response.success) {
            message.success('شبکه اجتماعی با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف شبکه اجتماعی');
          }
        } catch (error) {
          console.error('Delete social network error:', error);
          message.error('خطا در ارتباط با سرور');
        }
      },
    });
  };

  const columns: ProColumns<API.SocialNetworkItem>[] = [
    {
      title: 'نام شبکه',
      dataIndex: 'social',
      ellipsis: true,
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
      title: 'لینک',
      dataIndex: 'link',
      ellipsis: true,
      render: (text) => (
        <a href={text as string} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
      sorter: true,
    },
    {
      title: 'آیکون',
      dataIndex: 'icon',
      render: (_, record) =>
        record.icon ? (
          <Image
            src={record.icon}
            alt={record.alt_icon}
            width={50}
            height={50}
            style={{ objectFit: 'cover' }}
            preview={{
              src: record.icon,
            }}
          />
        ) : (
          <Tag>بدون آیکون</Tag>
        ),
      search: false,
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
            setCurrentItem(record);
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
      <ProTable<API.SocialNetworkItem>
        headerTitle="لیست شبکه های اجتماعی"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
        }}
        request={async (params = {}, sort, filter) => {
          const response = await getSocialNetworks({
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
            افزودن شبکه اجتماعی جدید
          </Button>,
        ]}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_current, size) => setPageSize(size),
        }}
        scroll={{ x: 900 }}
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

export default SocialNetworkTable;
