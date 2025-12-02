import { createCategory } from '@/services/category';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { Form, Input, InputNumber, Modal, Select, Upload, message } from 'antd';
import React, { useState } from 'react';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  categories: API.CategoryItem[];
}

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  categories,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Convert file to base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert image to base64 if exists
      let imageBase64: string | null = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageBase64 = await getBase64(fileList[0].originFileObj);
      }

      const payload: API.CategoryPayload = {
        title: values.title,
        parent_id: values.parent_id || '',
        priority: values.priority,
        status: values.status,
        image: imageBase64,
        alt_image: values.alt_image || null,
      };

      const response = await createCategory(payload);

      if (response.success) {
        form.resetFields();
        setFileList([]);
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد دسته‌بندی');
      }
    } catch (error) {
      console.error('Create category error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  // Upload props configuration
  const uploadProps: UploadProps = {
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
      return false; // Prevent auto upload
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    fileList,
    listType: 'picture-card',
    maxCount: 1,
  };

  // Filter out current categories that could cause circular references
  // Only show categories that don't have a parent (root categories) as potential parents
  const parentOptions = categories.map((cat) => ({
    label: cat.title,
    value: cat.id,
  }));

  return (
    <Modal
      title="افزودن دسته‌بندی جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'active',
          priority: 1,
        }}
      >
        <Form.Item
          name="title"
          label="عنوان"
          rules={[{ required: true, message: 'لطفاً عنوان را وارد کنید' }]}
        >
          <Input placeholder="عنوان دسته‌بندی" />
        </Form.Item>

        <Form.Item name="parent_id" label="دسته والد">
          <Select
            placeholder="انتخاب دسته والد (اختیاری)"
            allowClear
            showSearch
            optionFilterProp="label"
            options={parentOptions}
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="اولویت"
          rules={[{ required: true, message: 'لطفاً اولویت را وارد کنید' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={[
              { label: 'فعال', value: 'active' },
              { label: 'غیرفعال', value: 'inactive' },
            ]}
          />
        </Form.Item>

        <Form.Item label="تصویر">
          <Upload {...uploadProps}>
            {fileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item name="alt_image" label="متن جایگزین تصویر">
          <Input placeholder="توضیح تصویر برای SEO" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
