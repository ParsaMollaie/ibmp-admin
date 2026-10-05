import { updateProvince } from '@/services/location';
import { Form, Input, Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ProvinceItem | null;
}

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
      form.setFieldsValue({ name: record.name });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateProvince(record.id, { name: values.name });

      if (response.success) {
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش استان');
      }
    } catch (error) {
      console.error('Update province error:', error);
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
      title={record ? `ویرایش ${record.name}` : 'ویرایش استان'}
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

export default UpdateForm;
