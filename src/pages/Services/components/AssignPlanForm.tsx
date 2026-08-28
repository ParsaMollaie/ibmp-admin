import { getPlans } from '@/services/plan';
import { assignServicePlan } from '@/services/service';
import { Form, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface AssignPlanFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceItem | null;
}

const AssignPlanForm: React.FC<AssignPlanFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setPlansLoading(true);
      getPlans({ page_size: 100 })
        .then((res) => {
          if (res.success && res.data?.list) {
            setPlans(res.data.list);
          }
        })
        .catch(() => {
          message.error('خطا در دریافت لیست پلن‌ها');
        })
        .finally(() => {
          setPlansLoading(false);
        });
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await assignServicePlan(record.id, values.plan_id);

      if (response.success) {
        form.resetFields();
        message.success('پلن با موفقیت تخصیص داده شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در تخصیص پلن');
      }
    } catch (error) {
      console.error('Assign plan error:', error);
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
      title="تخصیص پلن"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="تخصیص"
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
          <div style={{ fontWeight: 600 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>کد: {record.code}</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="plan_id"
          label="پلن"
          rules={[{ required: true, message: 'لطفاً پلن را انتخاب کنید' }]}
        >
          <Select
            loading={plansLoading}
            placeholder="انتخاب پلن"
            options={plans.map((plan) => ({
              label: `${plan.name} — ${plan.month} ماه — ${plan.price} تومان`,
              value: plan.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignPlanForm;
