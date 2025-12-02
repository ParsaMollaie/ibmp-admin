import { updateCategory } from '@/services/category';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { Form, Input, InputNumber, Modal, Select, Upload, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CategoryItem | null;
  categories: API.CategoryItem[];
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
  categories,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Populate form when record changes
  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        title: record.title,
        parent_id: record.parent?.id || undefined,
        priority: record.priority,
        status: record.status,
        alt_image: record.alt_image,
      });

      // Set existing image in fileList if exists
      if (record.image) {
        setFileList([
          {
            uid: '-1',
            name: 'current-image',
            status: 'done',
            url: record.image,
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [record, visible, form]);

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
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Determine the image value
      let imageValue: string | null = null;

      if (fileList.length > 0) {
        const file = fileList[0];
        if (file.originFileObj) {
          // New file uploaded - convert to base64
          imageValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          // Existing image - keep the URL (or send null to keep it unchanged)
          // Depending on your API, you might need to handle this differently
          imageValue = file.url;
        }
      }

      const payload: API.CategoryPayload = {
        title: values.title,
        parent_id: values.parent_id || '',
        priority: values.priority,
        status: values.status,
        image: imageValue,
        alt_image: values.alt_image || null,
      };

      const response = await updateCategory(record.id, payload);

      if (response.success) {
        form.resetFields();
        setFileList([]);
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش دسته‌بندی');
      }
    } catch (error) {
      console.error('Update category error:', error);
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

  // Filter parent options - exclude current record to prevent circular reference
  const parentOptions = categories
    .filter((cat) => cat.id !== record?.id)
    .map((cat) => ({
      label: cat.title,
      value: cat.id,
    }));

  return (
    <Modal
      title="ویرایش دسته‌بندی"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={600}
    >
      <Form form={form} layout="vertical">
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

export default UpdateForm;
