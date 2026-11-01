import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getPaymentGateways } from '@/services/payment-gateway';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { Alert, Button, Card, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';
import { DRIVER_LABELS } from './constants';

const PaymentGatewaysPage: React.FC = () => {
  const access = useAccess();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<API.PaymentGatewayItem | null>(null);

  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize('payment-gateways', 20);

  const columns: ProColumns<API.PaymentGatewayItem>[] = [
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 160,
    },
    {
      title: 'نوع درگاه',
      dataIndex: 'driver',
      key: 'driver',
      width: 120,
      search: false,
      render: (_, record) => DRIVER_LABELS[record.driver] ?? record.driver,
    },
    {
      title: 'وضعیت',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      search: false,
      render: (_, record) =>
        record.is_active ? (
          <Tag color="green">فعال</Tag>
        ) : (
          <Tag color="default">غیرفعال</Tag>
        ),
    },
    {
      title: 'حالت',
      dataIndex: 'is_sandbox',
      key: 'is_sandbox',
      width: 110,
      search: false,
      render: (_, record) =>
        record.is_sandbox ? (
          <Tag color="orange">آزمایشی</Tag>
        ) : (
          <Tag color="blue">واقعی</Tag>
        ),
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: 'مرچنت کد',
      key: 'merchant_id',
      width: 130,
      search: false,
      render: (_, record) => (
        <span style={{ direction: 'ltr', display: 'inline-block' }}>
          {record.config?.merchant_id ?? '—'}
        </span>
      ),
    },
    {
      title: 'تاریخ بروزرسانی',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      search: false,
      render: (_, record) =>
        convertEnDateToFaDate(record.updated_at).format('YYYY/MM/DD HH:mm'),
    },
    {
      title: 'بروزرسانی شده توسط',
      dataIndex: 'updated_by',
      key: 'updated_by',
      width: 140,
      search: false,
      render: (_, record) =>
        record.updated_by
          ? `${record.updated_by.first_name} ${record.updated_by.last_name}`
          : '—',
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 80,
      search: false,
      fixed: 'right',
      render: (_, record) =>
        access.hasPermission('payment-gateways:update') && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setUpdateModalVisible(true);
            }}
          />
        ),
    },
  ];

  return (
    <Card>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="کاربران هنگام خرید طرح، از بین درگاه‌های فعال یکی را انتخاب می‌کنند (درگاه با اولویت کمتر پیش‌فرض است). برای آزمایش، حالت آزمایشی را روشن نگه دارید."
      />
      <ProTable<API.PaymentGatewayItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params, sort) => {
          const { title, current, pageSize } = params;
          const response = await getPaymentGateways({
            title: title || undefined,
            page: current,
            page_size: pageSize,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        toolbar={{
          title: 'درگاه‌های پرداخت',
          actions: access.hasPermission('payment-gateways:create')
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  افزودن درگاه
                </Button>,
              ]
            : [],
        }}
        search={{
          labelWidth: 'auto',
          searchText: 'جستجو',
          resetText: 'بازنشانی',
        }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          showTotal: (total) => `مجموع: ${total} درگاه`,
        }}
        scroll={{ x: 1100 }}
        dateFormatter="string"
        headerTitle={false}
      />

      <CreateForm
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          message.success('درگاه پرداخت با موفقیت ایجاد شد');
          actionRef.current?.reload();
        }}
      />

      <UpdateForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
          message.success('درگاه پرداخت با موفقیت ویرایش شد');
          actionRef.current?.reload();
        }}
        record={currentRecord}
      />
    </Card>
  );
};

export default PaymentGatewaysPage;
