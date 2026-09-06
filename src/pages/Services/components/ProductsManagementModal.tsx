import {
  createServiceProduct,
  deleteServiceProduct,
  getServiceProducts,
  toggleServiceProductStatus,
  updateServiceProduct,
} from '@/services/service-product';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

const UNIT_OPTIONS = [
  { label: 'عدد', value: 'عدد' },
  { label: 'متر', value: 'متر' },
  { label: 'مترمربع', value: 'مترمربع' },
  { label: 'مترمکعب', value: 'مترمکعب' },
  { label: 'گرم', value: 'گرم' },
  { label: 'کیلوگرم', value: 'کیلوگرم' },
  { label: 'تن', value: 'تن' },
  { label: 'لیتر', value: 'لیتر' },
  { label: 'بسته', value: 'بسته' },
  { label: 'جعبه', value: 'جعبه' },
  { label: 'ساعت', value: 'ساعت' },
  { label: 'روز', value: 'روز' },
  { label: 'نفر', value: 'نفر' },
];

interface ProductsManagementModalProps {
  visible: boolean;
  onCancel: () => void;
  onChanged: () => void;
  service: API.ServiceItem | null;
}

const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formatPrice = (price: number): string => {
  if (!price) return 'رایگان';
  return `${price.toLocaleString('fa-IR')} تومان`;
};

const ProductsManagementModal: React.FC<ProductsManagementModalProps> = ({
  visible,
  onCancel,
  onChanged,
  service,
}) => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<API.ServiceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<API.ServiceProduct | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [imageFile, setImageFile] = useState<UploadFile[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!service) return;
    setLoading(true);
    try {
      const response = await getServiceProducts(service.id);
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      message.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && service) {
      fetchProducts();
    }
    if (!visible) {
      setProducts([]);
      setFormVisible(false);
      setEditingProduct(null);
      form.resetFields();
      setImageFile([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, service]);

  const openAddForm = () => {
    setEditingProduct(null);
    form.resetFields();
    setImageFile([]);
    setFormVisible(true);
  };

  const openEditForm = (product: API.ServiceProduct) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      minimum_price: product.minimum_price,
      maximum_price: product.maximum_price,
      unit: product.unit,
    });
    setImageFile(
      product.image
        ? [
            {
              uid: '-image',
              name: 'image',
              status: 'done',
              url: product.image,
            },
          ]
        : [],
    );
    setFormVisible(true);
  };

  const getImageUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فقط فایل‌های تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('حجم تصویر باید کمتر از 2 مگابایت باشد');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setImageFile(info.fileList),
    fileList: imageFile,
    listType: 'picture-card',
    maxCount: 1,
  });

  const handleSubmit = async () => {
    if (!service) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      let imageValue = '';
      if (imageFile.length > 0) {
        const file = imageFile[0];
        if (file.originFileObj) {
          imageValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          imageValue = file.url;
        }
      }

      if (editingProduct) {
        const response = await updateServiceProduct(
          service.id,
          editingProduct.id,
          {
            name: values.name,
            image: imageValue || undefined,
            minimum_price: values.minimum_price || 0,
            maximum_price: values.maximum_price || 0,
            unit: values.unit || null,
          },
        );
        if (response.success) {
          message.success('محصول با موفقیت ویرایش شد');
          setFormVisible(false);
          await fetchProducts();
          onChanged();
        } else {
          message.error(response.message || 'خطا در ویرایش محصول');
        }
      } else {
        if (!imageValue) {
          message.error('تصویر محصول الزامی است');
          setSubmitting(false);
          return;
        }
        const response = await createServiceProduct(service.id, {
          name: values.name,
          image: imageValue,
          minimum_price: values.minimum_price || 0,
          maximum_price: values.maximum_price || 0,
          unit: values.unit || null,
        });
        if (response.success) {
          message.success('محصول با موفقیت اضافه شد');
          setFormVisible(false);
          await fetchProducts();
          onChanged();
        } else {
          message.error(response.message || 'خطا در ایجاد محصول');
        }
      }
    } catch (error) {
      console.error('Product submit error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: API.ServiceProduct) => {
    if (!service) return;
    setTogglingId(product.id);
    try {
      const response = await toggleServiceProductStatus(service.id, product.id);
      if (response.success) {
        message.success('وضعیت محصول تغییر یافت');
        await fetchProducts();
        onChanged();
      } else {
        message.error(response.message || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      message.error('خطا در ارتباط با سرور');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product: API.ServiceProduct) => {
    if (!service) return;
    setDeletingId(product.id);
    try {
      const response = await deleteServiceProduct(service.id, product.id);
      if (response.success) {
        message.success('محصول حذف شد');
        await fetchProducts();
        onChanged();
      } else {
        message.error(response.message || 'خطا در حذف محصول');
      }
    } catch (error) {
      message.error('خطا در ارتباط با سرور');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: 'تصویر',
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (image: string) =>
        image ? (
          <Image
            src={image}
            alt="product"
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          '—'
        ),
    },
    { title: 'نام', dataIndex: 'name', key: 'name' },
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
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: API.ServiceProduct) => (
        <Switch
          checked={status === 'active'}
          loading={togglingId === record.id}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="فعال"
          unCheckedChildren="غیرفعال"
        />
      ),
    },
    {
      title: 'عملیات',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: API.ServiceProduct) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditForm(record)}
          />
          <Popconfirm
            title="آیا از حذف این محصول مطمئنید؟"
            onConfirm={() => handleDelete(record)}
            okText="بله"
            cancelText="خیر"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={`مدیریت محصولات: ${service?.title || ''}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
    >
      {!formVisible && (
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={openAddForm}
          style={{ marginBottom: 16 }}
        >
          افزودن محصول
        </Button>
      )}

      {formVisible && (
        <Card
          size="small"
          title={editingProduct ? 'ویرایش محصول' : 'محصول جدید'}
          style={{ marginBottom: 16 }}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="نام محصول"
                  rules={[
                    { required: true, message: 'نام محصول را وارد کنید' },
                  ]}
                >
                  <Input placeholder="نام محصول" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="minimum_price" label="حداقل قیمت (تومان)">
                  <InputNumber<number>
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="maximum_price" label="حداکثر قیمت (تومان)">
                  <InputNumber<number>
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="تصویر محصول">
                  <Upload {...getImageUploadProps()}>
                    {imageFile.length === 0 && (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>آپلود</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="unit" label="واحد (مترمربع، کیلوگرم و ...)">
                  <Select
                    placeholder="انتخاب واحد"
                    options={UNIT_OPTIONS}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                {editingProduct ? 'ذخیره تغییرات' : 'افزودن'}
              </Button>
              <Button onClick={() => setFormVisible(false)}>انصراف</Button>
            </Space>
          </Form>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'محصولی ثبت نشده است' }}
      />
    </Modal>
  );
};

export default ProductsManagementModal;
