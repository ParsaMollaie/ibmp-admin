import { getContactUs } from '@/services/contact-us';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, Descriptions, Modal, Space, Tag } from 'antd';
import jalaliMoment from 'jalali-moment';
import React, { useRef, useState } from 'react';
import UpdateStatusForm from './components/UpdateForm';

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

  // ProTable action ref
  const actionRef = useRef<ActionType>();

  // ============================================
  // EVENT HANDLERS
  // ============================================

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
    actionRef.current?.reload();
  };

  // ============================================
  // PROTABLE COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.ContactUsItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      search: false,
    },
    {
      title: 'نام',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 150,
      search: false,
    },
    {
      title: 'موبایل',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 130,
      search: false,
    },
    {
      title: 'ایمیل',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      search: false,
      render: (_, record) =>
        record.email || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true,
      search: false,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      // Make status searchable with select dropdown
      valueType: 'select',
      valueEnum: {
        pending: { text: 'در انتظار پیگیری', status: 'Warning' },
        followed_up: { text: 'پیگیری شده', status: 'Success' },
      },
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      search: false,
      render: (_, record) => formatJalaliDate(record.created_at),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 100,
      search: false,
      fixed: 'right',
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
      <ProTable<API.ContactUsItem>
        columns={columns}
        actionRef={actionRef}
        // ProTable request function
        request={async (params) => {
          const { status, current, pageSize } = params;

          const response = await getContactUs({
            status: status || undefined,
            page: current,
            page_size: pageSize,
          });

          return {
            data: response?.data?.list || [],
            success: true,
            total: response?.data?.pagination?.total || 0,
          };
        }}
        rowKey="id"
        // Toolbar configuration
        toolbar={{
          title: 'مدیریت پیام‌های تماس با ما',
        }}
        // Search form configuration
        search={{
          labelWidth: 'auto',
          searchText: 'جستجو',
          resetText: 'بازنشانی',
          collapsed: false,
        }}
        // Pagination configuration
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `مجموع: ${total} پیام`,
        }}
        // Horizontal scroll for responsiveness
        scroll={{ x: 1100 }}
        // Date formatting
        dateFormatter="string"
        // Header title
        headerTitle={false}
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
