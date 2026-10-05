import { createProvince } from '@/services/location';
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

      const response = await createProvince({ name: values.name });

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد استان');
      }
    } catch (error) {
      console.error('Create province error:', error);
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
      title="افزودن استان جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={420}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="نام استان"
          rules={[{ required: true, message: 'لطفاً نام استان را وارد کنید' }]}
        >
          <Input placeholder="مثال: تهران" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
