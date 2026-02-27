import { updatePlan } from '@/services/plan';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  message,
} from 'antd';
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
  const [isFreeTrial, setIsFreeTrial] = useState(false);

  // Effect to populate form fields when record changes or modal opens
  // This ensures the form always reflects the current record's data
  useEffect(() => {
    if (record && visible) {
      const isTrial = record.is_free_trial || false;
      setIsFreeTrial(isTrial);
      form.setFieldsValue({
        name: record.name,
        month: record.month,
        // Parse the price string "1000.00" to number for the InputNumber component
        price: parseFloat(record.price),
        status: record.status,
        is_free_trial: isTrial,
        features: record.features || [],
        // attributes: record.attributes, // deprecated
      });
    }
  }, [record, visible, form]);

  // Handle free trial toggle — auto-set price=0 and month=1
  const handleFreeTrialChange = (checked: boolean) => {
    setIsFreeTrial(checked);
    if (checked) {
      form.setFieldsValue({ price: 0, month: 1 });
    }
  };

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
        attributes: '', // deprecated
        is_free_trial: values.is_free_trial || false,
        features: values.features || null,
        price: values.price,
      };

      // Call update API with record ID and new payload
      const response = await updatePlan(record.id, payload);

      if (response.success) {
        form.resetFields();
        setIsFreeTrial(false);
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
    setIsFreeTrial(false);
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

        {/* Free trial toggle */}
        <Form.Item
          name="is_free_trial"
          label="پلن آزمایشی رایگان"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="بله"
            unCheckedChildren="خیر"
            onChange={handleFreeTrialChange}
          />
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
            disabled={isFreeTrial}
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
            disabled={isFreeTrial}
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

        {/* Features — dynamic list replacing old attributes TextArea */}
        <Form.Item label="ویژگی‌ها">
          <Form.List name="features">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'title']}
                      rules={[
                        { required: true, message: 'عنوان ویژگی الزامی است' },
                      ]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder="عنوان ویژگی" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'included']}
                      valuePropName="checked"
                      initialValue={true}
                      style={{ marginBottom: 0 }}
                    >
                      <Switch
                        checkedChildren="شامل"
                        unCheckedChildren="ندارد"
                      />
                    </Form.Item>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{ color: '#ff4d4f', fontSize: 18 }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ title: '', included: true })}
                  block
                  icon={<PlusOutlined />}
                >
                  افزودن ویژگی
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Old attributes — deprecated, kept hidden
        <Form.Item name="attributes" label="ویژگی‌ها (قدیمی)">
          <Input.TextArea
            rows={4}
            placeholder="ویژگی‌ها و امکانات پلن را وارد کنید"
          />
        </Form.Item>
        */}
      </Form>
    </Modal>
  );
};

export default UpdateForm;
