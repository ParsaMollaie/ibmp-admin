import { getPlans } from '@/services/plan';
import { assignServicePlan } from '@/services/service';
import { Form, InputNumber, Modal, Select, Switch, message } from 'antd';
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

      const response = await assignServicePlan(record.id, {
        plan_id: values.plan_id,
        paid: values.paid || false,
        months: values.months || undefined,
      });

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
            onChange={(planId) => {
              const plan = plans.find((p) => p.id === planId);
              if (plan) {
                form.setFieldValue('months', plan.month);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="months"
          label="تعداد ماه (اختیاری)"
          tooltip="در صورت خالی بودن، مدت زمان خود پلن اعمال می‌شود"
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="تعداد ماه"
          />
        </Form.Item>

        <Form.Item
          name="paid"
          label="پرداخت شده توسط کاربر"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch checkedChildren="بله" unCheckedChildren="خیر" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignPlanForm;
