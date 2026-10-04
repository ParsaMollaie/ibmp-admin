import { updateComplaint } from '@/services/complaint';
import { Form, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceComplaintItem | null;
}

const statusOptions: { label: string; value: API.ServiceComplaintStatus }[] = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'در حال بررسی', value: 'in_review' },
  { label: 'حل شده', value: 'resolved' },
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
        status: record.status,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateComplaint(record.id, {
        status: values.status,
      });

      if (response.success) {
        form.resetFields();
        message.success('خطا با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی خطا');
      }
    } catch (error) {
      console.error('Update complaint error:', error);
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
      title="بروزرسانی خطا"
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
          <div style={{ fontSize: 12, color: '#666' }}>
            موبایل: {record.mobile}
          </div>
          {record.service && (
            <div style={{ fontSize: 12, color: '#666' }}>
              خدمت: {record.service.title} (کد: {record.service.code})
            </div>
          )}
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={statusOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
