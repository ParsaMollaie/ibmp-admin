import { createCity, getProvinces } from '@/services/location';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  defaultProvinceId?: string;
}

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  defaultProvinceId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<API.ProvinceItem[]>([]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const response = await getProvinces();
      if (response.success && response.data?.list) {
        setProvinces(response.data.list);
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (visible && defaultProvinceId) {
      form.setFieldsValue({ province_id: defaultProvinceId });
    }
  }, [visible, defaultProvinceId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await createCity({
        name: values.name,
        province_id: values.province_id,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
      });

      if (response.success) {
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد شهر');
      }
    } catch (error) {
      console.error('Create city error:', error);
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
      title="افزودن شهر جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={460}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="province_id"
          label="استان"
          rules={[{ required: true, message: 'لطفاً استان را انتخاب کنید' }]}
        >
          <Select
            placeholder="استان را انتخاب کنید"
            showSearch
            optionFilterProp="label"
            options={provinces.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="نام شهر"
          rules={[{ required: true, message: 'لطفاً نام شهر را وارد کنید' }]}
        >
          <Input placeholder="مثال: مشهد" />
        </Form.Item>

        <Form.Item
          name="latitude"
          label="عرض جغرافیایی (Latitude)"
          rules={[
            {
              type: 'number',
              min: -90,
              max: 90,
              message: 'عرض جغرافیایی باید بین ۹۰- تا ۹۰ باشد',
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} step={0.0001} dir="ltr" />
        </Form.Item>

        <Form.Item
          name="longitude"
          label="طول جغرافیایی (Longitude)"
          rules={[
            {
              type: 'number',
              min: -180,
              max: 180,
              message: 'طول جغرافیایی باید بین ۱۸۰- تا ۱۸۰ باشد',
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} step={0.0001} dir="ltr" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
