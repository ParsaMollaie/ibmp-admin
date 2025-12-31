import { getCompanyServices } from '@/services/company-service';
import {
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Image,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import UpdateForm from './components/UpdateForm';

const { Title, Text, Paragraph } = Typography;

// ============================================
// CONFIGURATION: Enums for ProTable
// ============================================

/**
 * Status configuration for ProTable's valueEnum feature
 * Maps API status values to display text and status colors
 */
const statusEnum: Record<string, { text: string; status: string }> = {
  pending: { text: 'در انتظار تایید', status: 'Warning' },
  approved: { text: 'تایید شده', status: 'Success' },
  rejected: { text: 'رد شده', status: 'Error' },
};

/**
 * Type configuration for ProTable's valueEnum feature
 * Maps API type values to display text and status colors
 */
const typeEnum: Record<string, { text: string; status: string }> = {
  regular: { text: 'عادی', status: 'Default' },
  promoted: { text: 'ویژه', status: 'Processing' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get color for status Tag component
 */
const getStatusColor = (status: API.CompanyServiceStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };
  return colorMap[status] || 'default';
};

/**
 * Get Persian label for status
 */
const getStatusLabel = (status: API.CompanyServiceStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
  };
  return labelMap[status] || status;
};

/**
 * Get color for type Tag component
 */
const getTypeColor = (type: API.CompanyServiceType): string => {
  const colorMap: Record<string, string> = {
    regular: 'default',
    promoted: 'blue',
  };
  return colorMap[type] || 'default';
};

/**
 * Get Persian label for type
 */
const getTypeLabel = (type: API.CompanyServiceType): string => {
  const labelMap: Record<string, string> = {
    regular: 'عادی',
    promoted: 'ویژه',
  };
  return labelMap[type] || type;
};

/**
 * Get Persian label for contact type
 */
const getContactTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    phone: 'تلفن',
    mobile: 'موبایل',
  };
  return typeMap[type] || type;
};

/**
 * Get Persian label for social media type
 */
const getSocialTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    instagram: 'اینستاگرام',
    telegram: 'تلگرام',
    eita: 'ایتا',
    bale: 'بله',
    whatsapp: 'واتساپ',
    website: 'وب‌سایت',
  };
  return typeMap[type] || type;
};

/**
 * Build full category path from recursive parent structure
 * Example: "اسکلت و سازه > قالب بندی بتن > روغن قالب"
 */
const buildCategoryPath = (
  category: API.CompanyServiceCategory | null,
): string => {
  if (!category) return '—';

  const parts: string[] = [];

  // Recursive function to collect all parent titles
  const collectParents = (cat: API.CompanyServiceCategoryParent | null) => {
    if (cat) {
      collectParents(cat.parent);
      parts.push(cat.title);
    }
  };

  collectParents(category.parent);
  parts.push(category.title);

  return parts.join(' > ');
};

/**
 * Format price to Persian locale with currency
 */
const formatPrice = (price: number): string => {
  if (price === 0) return 'رایگان';
  return `${price.toLocaleString('fa-IR')} تومان`;
};

const CompanyServicePage: React.FC = () => {
  // ============================================
  // REFS & STATE
  // ============================================

  const actionRef = useRef<ActionType>();

  // Modal visibility states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Currently selected record
  const [currentRecord, setCurrentRecord] =
    useState<API.CompanyServiceItem | null>(null);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Open update modal
  const handleEdit = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setUpdateModalVisible(true);
  };

  // Open detail view modal
  const handleViewDetail = (record: API.CompanyServiceItem) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // Handle successful update
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRecord(null);
    actionRef.current?.reload();
  };

  // ============================================
  // COLUMN DEFINITIONS
  // ============================================

  const columns: ProColumns<API.CompanyServiceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'عنوان سرویس',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: 'عنوان سرویس را وارد کنید',
      },
    },
    {
      title: 'شرکت',
      dataIndex: ['company', 'name'],
      key: 'company_name',
      width: 150,
      ellipsis: true,
      // Custom render to show company logo + name
      render: (_, record) => (
        <Space>
          {record.company.logo && (
            <Image
              src={record.company.logo}
              alt={record.company.name}
              width={24}
              height={24}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          )}
          <span>{record.company.name}</span>
        </Space>
      ),
      fieldProps: {
        placeholder: 'نام شرکت را وارد کنید',
      },
    },
    {
      title: 'دسته‌بندی',
      dataIndex: ['category', 'title'],
      key: 'category',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      // Show full category path on hover
      render: (_, record) => (
        <span title={buildCategoryPath(record.category)}>
          {record.category?.title || '—'}
        </span>
      ),
    },
    {
      title: 'محصولات',
      dataIndex: 'products',
      key: 'products',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tag icon={<ShoppingOutlined />}>
          {record.products?.length || 0} محصول
        </Tag>
      ),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusLabel(record.status)}
        </Tag>
      ),
      fieldProps: {
        placeholder: 'انتخاب وضعیت',
      },
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: typeEnum,
      render: (_, record) => (
        <Tag color={getTypeColor(record.type)}>{getTypeLabel(record.type)}</Tag>
      ),
      fieldProps: {
        placeholder: 'انتخاب نوع',
      },
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 100,
      hideInSearch: true,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
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
  // PRODUCTS TABLE COLUMNS (for detail modal)
  // ============================================

  const productColumns = [
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string) =>
        image ? (
          <Image
            src={image}
            alt="product"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: 'نام محصول',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'حداقل قیمت',
      dataIndex: 'minimum_price',
      key: 'minimum_price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'حداکثر قیمت',
      dataIndex: 'maximum_price',
      key: 'maximum_price',
      render: (price: number) => formatPrice(price),
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <ProTable<API.CompanyServiceItem>
        headerTitle="مدیریت سرویس‌های شرکت‌ها"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const response = await getCompanyServices({
            title: params.title,
            status: params.status,
            type: params.type,
            company_name: params.company_name,
            page: params.current,
            page_size: params.pageSize,
          });

          return {
            data: response.data?.list || [],
            success: response.success,
            total: response.data?.pagination?.total || 0,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `نمایش ${range[0]}-${range[1]} از ${total} سرویس`,
        }}
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        scroll={{ x: 1200 }}
        dateFormatter="string"
        cardBordered
      />

      {/* Update Modal */}
      <UpdateForm
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
        title="جزئیات سرویس"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={900}
      >
        {currentRecord && (
          <div>
            {/* Service Header */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {currentRecord.title}
                  </Title>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={getStatusColor(currentRecord.status)}>
                      {getStatusLabel(currentRecord.status)}
                    </Tag>
                    <Tag color={getTypeColor(currentRecord.type)}>
                      {getTypeLabel(currentRecord.type)}
                    </Tag>
                    <Text type="secondary">کد: {currentRecord.code}</Text>
                    <Text type="secondary">
                      اولویت: {currentRecord.priority}
                    </Text>
                  </Space>
                </div>
              </div>
            </Card>

            {/* Company Info */}
            <Divider orientation="right">اطلاعات شرکت</Divider>
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginBottom: 16,
                padding: 12,
                background: '#fafafa',
                borderRadius: 8,
              }}
            >
              {currentRecord.company.logo && (
                <Image
                  src={currentRecord.company.logo}
                  alt={currentRecord.company.name}
                  width={60}
                  height={60}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div>
                <Text strong>{currentRecord.company.name}</Text>
                <br />
                <Text type="secondary">
                  {currentRecord.company.province.name} -{' '}
                  {currentRecord.company.city.name}
                </Text>
              </div>
            </div>

            {/* Category */}
            <Divider orientation="right">دسته‌بندی</Divider>
            <Paragraph>
              <Tag color="blue">
                {buildCategoryPath(currentRecord.category)}
              </Tag>
            </Paragraph>

            {/* Description */}
            <Divider orientation="right">توضیحات</Divider>
            <Paragraph>{currentRecord.description}</Paragraph>

            {/* Contact Numbers */}
            {currentRecord.contact_numbers.length > 0 && (
              <>
                <Divider orientation="right">شماره‌های تماس سرویس</Divider>
                <Descriptions bordered column={2} size="small">
                  {currentRecord.contact_numbers.map((contact, index) => (
                    <Descriptions.Item
                      key={index}
                      label={getContactTypeLabel(contact.type)}
                    >
                      <span
                        style={{ direction: 'ltr', display: 'inline-block' }}
                      >
                        {contact.data}
                      </span>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            {/* Social Media */}
            {currentRecord.social_media.length > 0 && (
              <>
                <Divider orientation="right">شبکه‌های اجتماعی</Divider>
                <Descriptions bordered column={1} size="small">
                  {currentRecord.social_media.map((social, index) => (
                    <Descriptions.Item
                      key={index}
                      label={getSocialTypeLabel(social.type)}
                    >
                      <a
                        href={social.data}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ direction: 'ltr', display: 'inline-block' }}
                      >
                        <LinkOutlined style={{ marginLeft: 4 }} />
                        {social.data}
                      </a>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}

            {/* Products */}
            {currentRecord.products.length > 0 && (
              <>
                <Divider orientation="right">محصولات</Divider>
                <Table
                  columns={productColumns}
                  dataSource={currentRecord.products}
                  rowKey={(_, index) => `product-${index}`}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CompanyServicePage;
