import { updateServicePriority } from '@/services/service';
import { Form, InputNumber, Modal, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdatePriorityFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceItem | null;
}

const UpdatePriorityForm: React.FC<UpdatePriorityFormProps> = ({
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
        priority: record.priority,
        // Default to locked on open — this form is an explicit manual edit,
        // so a plain "change the number, save" flow should stick rather than
        // silently get overwritten by the next automatic rotation. Admins
        // who want to hand a service back to auto-rotation can uncheck it.
        priority_locked: true,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateServicePriority(
        record.id,
        values.priority,
        values.priority_locked,
      );

      if (response.success) {
        form.resetFields();
        message.success('اولویت خدمت با موفقیت تغییر کرد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی اولویت');
      }
    } catch (error) {
      console.error('Update priority error:', error);
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
      title="تغییر اولویت خدمت"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={450}
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
          <div style={{ fontWeight: 600 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>کد: {record.code}</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="priority"
          label="اولویت"
          rules={[{ required: true, message: 'لطفاً اولویت را وارد کنید' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="priority_locked"
          label="قفل اولویت"
          valuePropName="checked"
          tooltip="در صورت فعال بودن، این اولویت توسط سامانه چرخش خودکار (هر ۵ دقیقه) تغییر نمی‌کند"
        >
          <Switch checkedChildren="قفل است" unCheckedChildren="خودکار" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdatePriorityForm;
