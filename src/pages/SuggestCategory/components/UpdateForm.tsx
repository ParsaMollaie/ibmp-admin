import { updateSuggestCategory } from '@/services/suggest-category';
import { Form, Input, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.SuggestCategoryItem | null;
}

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
];

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        title: record.title,
        description: record.description,
        status: record.status,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: API.SuggestCategoryPayload = {
        title: values.title,
        description: values.description || null,
        status: values.status,
      };

      const response = await updateSuggestCategory(record.id, payload);

      if (response.success) {
        message.success('پیشنهاد دسته‌بندی با موفقیت ویرایش شد');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش پیشنهاد دسته‌بندی');
      }
    } catch (error) {
      console.error('Update suggest category error:', error);
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
      title="ویرایش پیشنهاد دسته‌بندی"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
    >
      <Form form={form} layout="vertical">
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

export default UpdateForm;
