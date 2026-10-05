import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { deleteCity, getAllCities, getProvinces } from '@/services/location';
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
import React, { useEffect, useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const CityTable: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [provinces, setProvinces] = useState<API.ProvinceItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<API.CityItem | null>(null);
  const [pageSize, setPageSize] = usePersistedPageSize('city', 20);

  useEffect(() => {
    (async () => {
      const response = await getProvinces();
      if (response.success && response.data?.list) {
        setProvinces(response.data.list);
      }
    })();
  }, []);

  const handleDelete = (record: API.CityItem) => {
    Modal.confirm({
      title: 'حذف شهر',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>آیا از حذف شهر زیر اطمینان دارید؟</p>
          <p style={{ fontWeight: 600 }}>{record.name}</p>
        </div>
      ),
      okText: 'بله، حذف شود',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          const response = await deleteCity(record.id);
          if (response.success) {
            message.success('شهر با موفقیت حذف شد');
            actionRef.current?.reload();
          } else {
            message.error(response.message || 'خطا در حذف شهر');
          }
        } catch (error) {
          console.error('Delete city error:', error);
        }
      },
    });
  };

  const columns: ProColumns<API.CityItem>[] = [
    {
      title: 'نام شهر',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'استان',
      dataIndex: 'province_id',
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        optionFilterProp: 'label',
      },
      request: async () =>
        provinces.map((p) => ({ label: p.name, value: p.id })),
      render: (_, record) => record.province?.name ?? '—',
    },
    {
      title: 'عرض جغرافیایی',
      dataIndex: 'latitude',
      search: false,
      render: (_, record) =>
        record.latitude ?? <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'طول جغرافیایی',
      dataIndex: 'longitude',
      search: false,
      render: (_, record) =>
        record.longitude ?? <span style={{ color: '#999' }}>—</span>,
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
        access.hasPermission('cities:update') && (
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
        access.hasPermission('cities:delete') && (
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
      <ProTable<API.CityItem>
        headerTitle="لیست شهرها"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        request={async (params = {}) => {
          const { name, province_id, current, pageSize: size } = params;

          const response = await getAllCities({
            name: name || undefined,
            province_id: province_id || undefined,
            page: current,
            page_size: size,
          });

          return {
            data: response?.data?.list || [],
            success: response.success,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        columns={columns}
        toolBarRender={() =>
          access.hasPermission('cities:create')
            ? [
                <Button
                  key="add"
                  type="primary"
                  onClick={() => setCreateModalVisible(true)}
                >
                  افزودن شهر جدید
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
        scroll={{ x: 900 }}
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

export default CityTable;
