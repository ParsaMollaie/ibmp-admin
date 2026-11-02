import { createPaymentGateway } from '@/services/payment-gateway';
import { Form, Input, InputNumber, Modal, Select, Switch, message } from 'antd';
import React, { useState } from 'react';
import {
  DRIVER_LABELS,
  DRIVER_OPTIONS,
  SANDBOX_DRIVERS,
  TERMINAL_ID_PATTERN,
} from '../constants';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const driver: API.PaymentGatewayDriver =
    Form.useWatch('driver', form) ?? 'zarinpal';

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await createPaymentGateway({
        driver: values.driver,
        title: values.title,
        is_active: values.is_active,
        is_sandbox: SANDBOX_DRIVERS.includes(values.driver)
          ? values.is_sandbox
          : false,
        priority: values.priority,
        config:
          values.driver === 'sep'
            ? { terminal_id: values.terminal_id?.trim() }
            : { merchant_id: values.merchant_id?.trim() },
      });

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد درگاه پرداخت');
      }
    } catch (error) {
      console.error('Create payment gateway error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="افزودن درگاه پرداخت"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      okText="ایجاد"
      cancelText="انصراف"
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          driver: 'zarinpal',
          title: 'زرین‌پال',
          is_active: false,
          is_sandbox: true,
          priority: 1,
        }}
      >
        <Form.Item
          name="driver"
          label="نوع درگاه"
          rules={[{ required: true, message: 'نوع درگاه را انتخاب کنید' }]}
        >
          <Select
            options={DRIVER_OPTIONS}
            onChange={(value: API.PaymentGatewayDriver) =>
              form.setFieldsValue({ title: DRIVER_LABELS[value] })
            }
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="عنوان نمایشی"
          tooltip="این عنوان در پیش‌فاکتور به کاربر نمایش داده می‌شود"
          rules={[
            { required: true, message: 'عنوان را وارد کنید' },
            { max: 100, message: 'حداکثر ۱۰۰ کاراکتر' },
          ]}
        >
          <Input placeholder="مثال: زرین‌پال" />
        </Form.Item>

        {driver === 'sep' ? (
          <Form.Item
            name="terminal_id"
            label="شماره ترمینال"
            tooltip="از پرداخت الکترونیک سامان (سپ) دریافت کنید. IP سرور باید نزد سپ ثبت شده باشد"
            rules={[
              { required: true, message: 'شماره ترمینال را وارد کنید' },
              {
                pattern: TERMINAL_ID_PATTERN,
                message: 'شماره ترمینال باید فقط عدد باشد',
              },
            ]}
          >
            <Input placeholder="مثال: 13456789" style={{ direction: 'ltr' }} />
          </Form.Item>
        ) : (
          <Form.Item
            name="merchant_id"
            label="مرچنت کد (Merchant ID)"
            tooltip="از پنل زرین‌پال دریافت کنید؛ به‌صورت رمزنگاری‌شده ذخیره می‌شود"
            rules={[
              { required: true, message: 'مرچنت کد را وارد کنید' },
              {
                pattern: UUID_PATTERN,
                message: 'مرچنت کد باید یک UUID معتبر باشد',
              },
            ]}
          >
            <Input.Password
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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

        {SANDBOX_DRIVERS.includes(driver) && (
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

export default CreateForm;
