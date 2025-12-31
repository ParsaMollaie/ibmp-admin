import { getContactUs } from '@/services/contact-us';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import jalaliMoment from 'jalali-moment';
import React, { useState } from 'react';
import UpdateStatusForm from './components/UpdateForm';

const { Title } = Typography;

// Helper function to format dates to Jalali (Persian) calendar
const formatJalaliDate = (dateString: string): string => {
  if (!dateString) return '—';
  return jalaliMoment(dateString).locale('fa').format('jYYYY/jMM/jDD HH:mm');
};

// Helper function to get status color and label
const getStatusConfig = (
  status: API.ContactUsStatus,
): { color: string; label: string } => {
  const statusMap: Record<
    API.ContactUsStatus,
    { color: string; label: string }
  > = {
    pending: { color: 'warning', label: 'در انتظار پیگیری' },
    followed_up: { color: 'success', label: 'پیگیری شده' },
  };
  return statusMap[status] || { color: 'default', label: status };
};

const ContactUsPage: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Modal visibility states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Currently selected record
  const [currentRecord, setCurrentRecord] = useState<API.ContactUsItem | null>(
    null,
  );

  // Filter state for status dropdown
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  // ============================================
  // DATA FETCHING
  // ============================================

  // useRequest hook for fetching contact us submissions
  const {
    data: contactUsData,
    loading,
    refresh,
  } = useRequest(() => getContactUs({ status: statusFilter }), {
    refreshDeps: [statusFilter],
  });

  // Safely extract the list from nested API response
  const contactUsList = contactUsData?.data?.list || [];

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Handle status filter change
  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  // Open status update modal
  const handleEdit = (record: API.ContactUsItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Open detail view modal
  const handleViewDetail = (record: API.ContactUsItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // Handle successful status update
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    refresh();
  };

  // ============================================
  // TABLE COLUMN DEFINITIONS
  // ============================================

  const columns: ColumnsType<API.ContactUsItem> = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
    },
    {
      title: 'نام',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 150,
    },
    {
      title: 'موبایل',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 130,
    },
    {
      title: 'ایمیل',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      // Show dash if email is null
      render: (email: string | null) =>
        email || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      // Render status as colored tag
      render: (status: API.ContactUsStatus) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      // Format to Jalali calendar
      render: (date: string) => formatJalaliDate(date),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 100,
      // Render action buttons
      render: (_, record) => (
        <Space>
          {/* View detail button */}
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
          {/* Edit status button */}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      {/* Header section with title and filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          مدیریت پیام‌های تماس با ما
        </Title>
        <Space>
          {/* Status filter dropdown */}
          <Select
            placeholder="فیلتر وضعیت"
            allowClear
            style={{ width: 180 }}
            onChange={handleStatusChange}
            options={[
              { label: 'در انتظار پیگیری', value: 'pending' },
              { label: 'پیگیری شده', value: 'followed_up' },
            ]}
          />
        </Space>
      </div>

      {/* Main data table */}
      <Table
        columns={columns}
        dataSource={contactUsList}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          total: contactUsData?.data?.pagination?.total || 0,
          pageSize: contactUsData?.data?.pagination?.page_size || 10,
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} پیام`,
        }}
      />

      {/* Update Status Modal */}
      <UpdateStatusForm
        visible={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRecord(null);
        }}
        onSuccess={handleUpdateSuccess}
        record={currentRecord}
      />

      {/* Detail View Modal */}
      <Modal
        title="جزئیات پیام"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={600}
      >
        {currentRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="کد">
              {currentRecord.code}
            </Descriptions.Item>
            <Descriptions.Item label="نام">
              {currentRecord.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="موبایل">
              {currentRecord.mobile}
            </Descriptions.Item>
            <Descriptions.Item label="ایمیل">
              {currentRecord.email || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="عنوان">
              {currentRecord.title}
            </Descriptions.Item>
            <Descriptions.Item label="توضیحات">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {currentRecord.description}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="وضعیت">
              {(() => {
                const config = getStatusConfig(currentRecord.status);
                return <Tag color={config.color}>{config.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="تاریخ ایجاد">
              {formatJalaliDate(currentRecord.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="آخرین بروزرسانی">
              {formatJalaliDate(currentRecord.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
};

export default ContactUsPage;
