import {
  createServiceWorkSample,
  deleteServiceWorkSample,
  getServiceWorkSamples,
  toggleServiceWorkSampleStatus,
  updateServiceWorkSample,
} from '@/services/service-work-sample';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

interface WorkSamplesManagementModalProps {
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

const WorkSamplesManagementModal: React.FC<WorkSamplesManagementModalProps> = ({
  visible,
  onCancel,
  onChanged,
  service,
}) => {
  const [form] = Form.useForm();
  const [samples, setSamples] = useState<API.ServiceWorkSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSample, setEditingSample] =
    useState<API.ServiceWorkSample | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [imageFile, setImageFile] = useState<UploadFile[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSamples = async () => {
    if (!service) return;
    setLoading(true);
    try {
      const response = await getServiceWorkSamples(service.id);
      if (response.success) {
        setSamples(response.data || []);
      }
    } catch (error) {
      message.error('خطا در دریافت نمونه‌کارها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && service) {
      fetchSamples();
    }
    if (!visible) {
      setSamples([]);
      setFormVisible(false);
      setEditingSample(null);
      form.resetFields();
      setImageFile([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, service]);

  const openAddForm = () => {
    setEditingSample(null);
    form.resetFields();
    setImageFile([]);
    setFormVisible(true);
  };

  const openEditForm = (sample: API.ServiceWorkSample) => {
    setEditingSample(sample);
    form.setFieldsValue({ title: sample.title || '' });
    setImageFile(
      sample.image
        ? [
            {
              uid: '-image',
              name: 'image',
              status: 'done',
              url: sample.image,
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

      if (editingSample) {
        const response = await updateServiceWorkSample(
          service.id,
          editingSample.id,
          {
            title: values.title || '',
            image: imageValue || undefined,
          },
        );
        if (response.success) {
          message.success('نمونه کار با موفقیت ویرایش شد');
          setFormVisible(false);
          await fetchSamples();
          onChanged();
        } else {
          message.error(response.message || 'خطا در ویرایش نمونه کار');
        }
      } else {
        if (!imageValue) {
          message.error('تصویر نمونه کار الزامی است');
          setSubmitting(false);
          return;
        }
        const response = await createServiceWorkSample(service.id, {
          title: values.title || '',
          image: imageValue,
        });
        if (response.success) {
          message.success('نمونه کار با موفقیت اضافه شد');
          setFormVisible(false);
          await fetchSamples();
          onChanged();
        } else {
          message.error(response.message || 'خطا در ایجاد نمونه کار');
        }
      }
    } catch (error) {
      console.error('Work sample submit error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (sample: API.ServiceWorkSample) => {
    if (!service) return;
    setTogglingId(sample.id);
    try {
      const response = await toggleServiceWorkSampleStatus(
        service.id,
        sample.id,
      );
      if (response.success) {
        message.success('وضعیت نمونه کار تغییر یافت');
        await fetchSamples();
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

  const handleDelete = async (sample: API.ServiceWorkSample) => {
    if (!service) return;
    setDeletingId(sample.id);
    try {
      const response = await deleteServiceWorkSample(service.id, sample.id);
      if (response.success) {
        message.success('نمونه کار حذف شد');
        await fetchSamples();
        onChanged();
      } else {
        message.error(response.message || 'خطا در حذف نمونه کار');
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
            alt="sample"
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          '—'
        ),
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      render: (title: string | null) => title || '—',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: API.ServiceWorkSample) => (
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
      render: (_: unknown, record: API.ServiceWorkSample) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditForm(record)}
          />
          <Popconfirm
            title="آیا از حذف این نمونه کار مطمئنید؟"
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
      title={`مدیریت نمونه‌کارها: ${service?.title || ''}`}
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
          افزودن نمونه کار
        </Button>
      )}

      {formVisible && (
        <Card
          size="small"
          title={editingSample ? 'ویرایش نمونه کار' : 'نمونه کار جدید'}
          style={{ marginBottom: 16 }}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item name="title" label="عنوان نمونه کار">
                  <Input placeholder="عنوان (اختیاری)" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="تصویر نمونه کار">
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
            <Space>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                {editingSample ? 'ذخیره تغییرات' : 'افزودن'}
              </Button>
              <Button onClick={() => setFormVisible(false)}>انصراف</Button>
            </Space>
          </Form>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={samples}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'نمونه کاری ثبت نشده است' }}
      />
    </Modal>
  );
};

export default WorkSamplesManagementModal;
