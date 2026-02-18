import { createSuggestCategory } from '@/services/suggest-category';
import { Form, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

const { TextArea } = Input;

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
];

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: API.SuggestCategoryPayload = {
        title: values.title,
        description: values.description || null,
        status: values.status,
      };

      const response = await createSuggestCategory(payload);

      if (response.success) {
        message.success('پیشنهاد دسته‌بندی با موفقیت ایجاد شد');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد پیشنهاد دسته‌بندی');
      }
    } catch (error) {
      console.error('Create suggest category error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="افزودن پیشنهاد دسته‌بندی"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'pending' }}>
        <Form.Item
          name="title"
          label="عنوان"
          rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
        >
          <Input placeholder="عنوان پیشنهاد دسته‌بندی" />
        </Form.Item>

        <Form.Item name="description" label="توضیحات">
          <TextArea rows={4} placeholder="توضیحات (اختیاری)" />
        </Form.Item>

        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'وضعیت را انتخاب کنید' }]}
        >
          <Select placeholder="انتخاب وضعیت" options={statusOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
