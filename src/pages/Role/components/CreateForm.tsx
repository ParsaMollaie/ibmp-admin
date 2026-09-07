import { createRole } from '@/services/role';
import { Form, Input, Modal, message } from 'antd';
import React, { useState } from 'react';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

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

      const payload: API.RolePayload = {
        name: values.name,
        title: values.title,
      };

      const response = await createRole(payload);

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد نقش');
      }
    } catch (error) {
      console.error('Create role error:', error);
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
      title="افزودن نقش جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="نام نقش (انگلیسی)"
          rules={[
            { required: true, message: 'لطفاً نام نقش را وارد کنید' },
            {
              pattern: /^[A-Za-z0-9_-]+$/,
              message:
                'نام نقش فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد',
            },
          ]}
        >
          <Input placeholder="مثال: ContentEditor" dir="ltr" />
        </Form.Item>

        <Form.Item name="title" label="عنوان نمایشی (فارسی)">
          <Input placeholder="مثال: ویرایشگر محتوا" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
