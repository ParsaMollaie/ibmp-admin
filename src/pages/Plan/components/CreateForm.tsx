import { createPlan } from '@/services/plan';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

// Props interface defining what this component receives from parent
interface CreateFormProps {
  visible: boolean; // Controls modal visibility
  onCancel: () => void; // Callback when user cancels
  onSuccess: () => void; // Callback when creation succeeds
}

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  // Form instance for programmatic control (validation, reset, etc.)
  const [form] = Form.useForm();
  // Loading state to show spinner on submit button
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate all form fields and get their values
      const values = await form.validateFields();
      setLoading(true);

      // Construct the payload matching API expectations
      const payload: API.PlanPayload = {
        name: values.name,
        status: values.status,
        month: values.month,
        attributes: values.attributes || '',
        price: values.price,
      };

      // Call the API to create the plan
      const response = await createPlan(payload);

      if (response.success) {
        // Reset form to initial state
        form.resetFields();
        // Notify parent component of success
        onSuccess();
      } else {
        // Show error message from API response
        message.error(response.message || 'خطا در ایجاد پلن');
      }
    } catch (error) {
      console.error('Create plan error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel - reset form and notify parent
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="افزودن پلن جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        // Set sensible default values
        initialValues={{
          status: 'active',
          month: 1,
          price: 0,
        }}
      >
        {/* Plan name field - required */}
        <Form.Item
          name="name"
          label="نام پلن"
          rules={[{ required: true, message: 'لطفاً نام پلن را وارد کنید' }]}
        >
          <Input placeholder="مثال: پلن یک ماهه" />
        </Form.Item>

        {/* Duration in months - required, minimum 1 */}
        <Form.Item
          name="month"
          label="مدت زمان (ماه)"
          rules={[{ required: true, message: 'لطفاً مدت زمان را وارد کنید' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="تعداد ماه"
          />
        </Form.Item>

        {/* Price field - required, minimum 0 */}
        <Form.Item
          name="price"
          label="قیمت (تومان)"
          rules={[{ required: true, message: 'لطفاً قیمت را وارد کنید' }]}
        >
          <InputNumber<number>
            min={0}
            style={{ width: '100%' }}
            placeholder="قیمت پلن"
            // Format number with thousand separators for better readability
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={(value) => {
              // Remove commas and convert to number
              // Return 0 if value is empty or undefined
              if (!value) return 0;
              const numericValue = Number(value.replace(/,/g, ''));
              return isNaN(numericValue) ? 0 : numericValue;
            }}
          />
        </Form.Item>

        {/* Status selector - required */}
        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={[
              { label: 'فعال', value: 'active' },
              { label: 'غیرفعال', value: 'inactive' },
            ]}
          />
        </Form.Item>

        {/* Attributes/features - optional text area for plan details */}
        <Form.Item name="attributes" label="ویژگی‌ها">
          <Input.TextArea
            rows={4}
            placeholder="ویژگی‌ها و امکانات پلن را وارد کنید"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
