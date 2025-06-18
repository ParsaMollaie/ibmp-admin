import { getSocialNetworks } from '@/services/auth';
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

const SocialNetworkTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<API.SocialNetworkItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<API.SocialNetworkItem | null>(
    null,
  );

  const columns: ProColumns<API.SocialNetworkItem>[] = [
    {
      title: 'نام شبکه',
      dataIndex: 'social',
      ellipsis: true,
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
      title: 'لینک',
      dataIndex: 'link',
      ellipsis: true,
      render: (text) => (
        <a href={text as string} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
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
            افزودن شبکه اجتماعی جدید
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

export default SocialNetworkTable;
