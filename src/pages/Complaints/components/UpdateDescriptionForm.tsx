import { updateComplaintDescription } from '@/services/complaint';
import { Form, Input, Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;

interface UpdateDescriptionFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceComplaintItem | null;
}

const UpdateDescriptionForm: React.FC<UpdateDescriptionFormProps> = ({
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
        description: record.description,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateComplaintDescription(
        record.id,
        values.description,
      );

      if (response.success) {
        form.resetFields();
        message.success('متن خطا با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی متن خطا');
      }
    } catch (error) {
      console.error('Update complaint description error:', error);
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
      title="ویرایش متن خطا"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={500}
    >
      {record && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {record.first_name} {record.last_name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>کد: {record.code}</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label="متن خطا"
          rules={[{ required: true, message: 'لطفاً متن خطا را وارد کنید' }]}
        >
          <TextArea rows={4} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateDescriptionForm;
