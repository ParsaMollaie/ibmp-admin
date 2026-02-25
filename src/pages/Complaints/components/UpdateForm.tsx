import { updateComplaint } from '@/services/complaint';
import { Form, Input, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;

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
        admin_note: record.admin_note || '',
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
        admin_note: values.admin_note || null,
      });

      if (response.success) {
        form.resetFields();
        message.success('شکایت با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی شکایت');
      }
    } catch (error) {
      console.error('Update complaint error:', error);
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
      title="بروزرسانی شکایت"
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

        <Form.Item name="admin_note" label="یادداشت مدیر">
          <TextArea
            rows={4}
            maxLength={2000}
            showCount
            placeholder="یادداشت خود را وارد کنید..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
