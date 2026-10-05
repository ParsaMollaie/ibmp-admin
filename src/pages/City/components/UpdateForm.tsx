import { getProvinces, updateCity } from '@/services/location';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CityItem | null;
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
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
    if (record && visible) {
      form.setFieldsValue({
        name: record.name,
        province_id: record.province_id,
        latitude: record.latitude ?? undefined,
        longitude: record.longitude ?? undefined,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateCity(record.id, {
        name: values.name,
        province_id: values.province_id,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
      });

      if (response.success) {
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش شهر');
      }
    } catch (error) {
      console.error('Update city error:', error);
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
      title={record ? `ویرایش ${record.name}` : 'ویرایش شهر'}
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

export default UpdateForm;
