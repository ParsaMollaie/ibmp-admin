import { updatePlan } from '@/services/plan';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

// Props interface - similar to CreateForm but includes the record being edited
interface UpdateFormProps {
  visible: boolean; // Controls modal visibility
  onCancel: () => void; // Callback when user cancels
  onSuccess: () => void; // Callback when update succeeds
  record: API.PlanItem | null; // The plan record being edited (null when modal is closed)
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Effect to populate form fields when record changes or modal opens
  // This ensures the form always reflects the current record's data
  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        name: record.name,
        month: record.month,
        // Parse the price string "1000.00" to number for the InputNumber component
        price: parseFloat(record.price),
        status: record.status,
        attributes: record.attributes,
      });
    }
  }, [record, visible, form]);

  // Handle form submission
  const handleSubmit = async () => {
    // Guard clause - don't proceed if no record is set
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Construct the payload - same structure as create
      const payload: API.PlanPayload = {
        name: values.name,
        status: values.status,
        month: values.month,
        attributes: values.attributes || '',
        price: values.price,
      };

      // Call update API with record ID and new payload
      const response = await updatePlan(record.id, payload);

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش پلن');
      }
    } catch (error) {
      console.error('Update plan error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel - reset form state
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="ویرایش پلن"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={600}
    >
      <Form form={form} layout="vertical">
        {/* Plan name field */}
        <Form.Item
          name="name"
          label="نام پلن"
          rules={[{ required: true, message: 'لطفاً نام پلن را وارد کنید' }]}
        >
          <Input placeholder="مثال: پلن یک ماهه" />
        </Form.Item>

        {/* Duration in months */}
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

        {/* Price with thousand separator formatting */}
        <Form.Item
          name="price"
          label="قیمت (تومان)"
          rules={[{ required: true, message: 'لطفاً قیمت را وارد کنید' }]}
        >
          <InputNumber<number>
            min={0}
            style={{ width: '100%' }}
            placeholder="قیمت پلن"
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

        {/* Status selector */}
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

        {/* Attributes/features text area */}
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

export default UpdateForm;
