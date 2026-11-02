import { updatePaymentGateway } from '@/services/payment-gateway';
import { Form, Input, InputNumber, Modal, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  DRIVER_LABELS,
  SANDBOX_DRIVERS,
  TERMINAL_ID_PATTERN,
} from '../constants';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.PaymentGatewayItem | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isSep = record?.driver === 'sep';

  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        title: record.title,
        priority: record.priority,
        is_sandbox: record.is_sandbox,
        is_active: record.is_active,
        // Never prefilled: the stored secret is only shown masked as placeholder.
        merchant_id: '',
        // Not a secret (printed on receipts), so shown as-is.
        terminal_id: record.config?.terminal_id ?? '',
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updatePaymentGateway(record.id, {
        title: values.title,
        is_active: values.is_active,
        is_sandbox: isSep ? false : values.is_sandbox,
        priority: values.priority,
        // Empty = keep the stored value
        config: isSep
          ? { terminal_id: values.terminal_id?.trim() || '' }
          : { merchant_id: values.merchant_id?.trim() || '' },
      });

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش درگاه پرداخت');
      }
    } catch (error) {
      console.error('Update payment gateway error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`ویرایش درگاه ${
        record ? DRIVER_LABELS[record.driver] ?? record.driver : ''
      }`}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="عنوان نمایشی"
          rules={[
            { required: true, message: 'عنوان را وارد کنید' },
            { max: 100, message: 'حداکثر ۱۰۰ کاراکتر' },
          ]}
        >
          <Input />
        </Form.Item>

        {isSep ? (
          <Form.Item
            name="terminal_id"
            label="شماره ترمینال"
            rules={[
              { required: true, message: 'شماره ترمینال را وارد کنید' },
              {
                pattern: TERMINAL_ID_PATTERN,
                message: 'شماره ترمینال باید فقط عدد باشد',
              },
            ]}
          >
            <Input style={{ direction: 'ltr' }} />
          </Form.Item>
        ) : (
          <Form.Item
            name="merchant_id"
            label="مرچنت کد (Merchant ID)"
            extra={`مقدار فعلی: ${
              record?.config?.merchant_id ?? '—'
            } — برای تغییر ندادن خالی بگذارید`}
            rules={[
              {
                pattern: UUID_PATTERN,
                message: 'مرچنت کد باید یک UUID معتبر باشد',
              },
            ]}
          >
            <Input.Password
              placeholder="بدون تغییر"
              style={{ direction: 'ltr' }}
              autoComplete="new-password"
            />
          </Form.Item>
        )}

        <Form.Item
          name="priority"
          label="اولویت"
          tooltip="عدد کمتر = بالاتر در لیست درگاه‌ها و انتخاب پیش‌فرض"
          rules={[{ required: true, message: 'اولویت را وارد کنید' }]}
        >
          <InputNumber min={1} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        {record && SANDBOX_DRIVERS.includes(record.driver) && (
          <Form.Item
            name="is_sandbox"
            label="حالت آزمایشی (Sandbox)"
            valuePropName="checked"
            tooltip="در حالت آزمایشی پرداخت واقعی انجام نمی‌شود"
          >
            <Switch checkedChildren="آزمایشی" unCheckedChildren="واقعی" />
          </Form.Item>
        )}

        <Form.Item name="is_active" label="فعال" valuePropName="checked">
          <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
