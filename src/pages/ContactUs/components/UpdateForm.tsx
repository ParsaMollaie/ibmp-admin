import { updateContactUsStatus } from '@/services/contact-us';
import { Form, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

// Props interface for the status update modal
interface UpdateStatusFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ContactUsItem | null;
}

const UpdateStatusForm: React.FC<UpdateStatusFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Populate form when record changes or modal opens
  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        status: record.status,
      });
    }
  }, [record, visible, form]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: API.ContactUsPayload = {
        status: values.status,
      };

      const response = await updateContactUsStatus(record.id, payload);

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی وضعیت');
      }
    } catch (error) {
      console.error('Update status error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="تغییر وضعیت پیام"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={400}
    >
      {/* Display contact info for reference */}
      {record && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <strong>نام:</strong> {record.full_name}
          </div>
          <div style={{ marginBottom: 4 }}>
            <strong>موبایل:</strong> {record.mobile}
          </div>
          <div>
            <strong>عنوان:</strong> {record.title}
          </div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={[
              { label: 'در انتظار پیگیری', value: 'pending' },
              { label: 'پیگیری شده', value: 'followed_up' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateStatusForm;
