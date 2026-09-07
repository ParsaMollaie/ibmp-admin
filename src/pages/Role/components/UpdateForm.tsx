import { updateRole } from '@/services/role';
import { Form, Input, Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.RoleItem | null;
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
      form.setFieldsValue({
        name: record.name,
        title: record.title,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: API.RolePayload = {
        name: values.name,
        title: values.title,
      };

      const response = await updateRole(record.id, payload);

      if (response.success) {
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش نقش');
      }
    } catch (error) {
      console.error('Update role error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const isSuperAdmin = record?.name === 'SuperAdmin';

  return (
    <Modal
      title="ویرایش نقش"
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
          <Input
            placeholder="مثال: ContentEditor"
            dir="ltr"
            disabled={isSuperAdmin}
          />
        </Form.Item>

        <Form.Item name="title" label="عنوان نمایشی (فارسی)">
          <Input placeholder="مثال: ویرایشگر محتوا" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
