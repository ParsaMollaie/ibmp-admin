import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { deleteProvince, getProvinces } from '@/services/location';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { Button, message, Modal } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const ProvinceTable: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<API.ProvinceItem | null>(null);
  const [pageSize, setPageSize] = usePersistedPageSize('province', 20);

  const handleDelete = (record: API.ProvinceItem) => {
    Modal.confirm({
      title: 'حذف استان',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف استان زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.name}</p>
          <p style={{ color: '#999' }}>
            در صورتی که شهرهایی به این استان متصل باشند، حذف امکان‌پذیر نخواهد
            بود.
          </p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteProvince(record.id);
          if (response.success) {
            message.success('استان با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف استان');
          }
        } catch (error) {
          console.error('Delete province error:', error);
        }
      },
    });
  };

  const columns: ProColumns<API.ProvinceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      width: 80,
      search: false,
    },
    {
      title: 'نام استان',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'ایجاد شده توسط',
      dataIndex: 'created_by',
      search: false,
      width: 150,
      render: (_, record) =>
        record.created_by
          ? `${record.created_by.first_name} ${record.created_by.last_name}`
          : '—',
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      search: false,
      width: 150,
      render: (_, record) =>
        record.created_at
          ? convertEnDateToFaDate(record.created_at).format('YYYY/MM/DD HH:mm')
          : '—',
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        access.hasPermission('provinces:update') && (
          <a
            key="edit"
            onClick={() => {
              setCurrentItem(record);
              setUpdateModalVisible(true);
            }}
          >
            ویرایش
          </a>
        ),
        access.hasPermission('provinces:delete') && (
          <a
            key="delete"
            style={{ color: '#ff4d4f' }}
            onClick={() => handleDelete(record)}
          >
            حذف
          </a>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ProvinceItem>
        headerTitle="لیست استان‌ها"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        request={async (params = {}) => {
          const response = await getProvinces();
          const list = response?.data?.list || [];
          const filtered = params.name
            ? list.filter((p) => p.name.includes(params.name as string))
            : list;

          return {
            data: filtered,
            success: response.success,
            total: filtered.length,
          };
        }}
        columns={columns}
        toolBarRender={() =>
          access.hasPermission('provinces:create')
            ? [
                <Button
                  key="add"
                  type="primary"
                  onClick={() => setCreateModalVisible(true)}
                >
                  افزودن استان جدید
                </Button>,
              ]
            : []
        }
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_current, size) => setPageSize(size),
        }}
        scroll={{ x: 700 }}
      />

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
          record={currentItem}
        />
      )}
    </PageContainer>
  );
};

export default ProvinceTable;
