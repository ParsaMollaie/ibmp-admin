import { updateCompanyStatus } from '@/services/company';
import { Form, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateStatusFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CompanyItem | null;
}

const statusOptions: { label: string; value: API.CompanyStatus }[] = [
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
  { label: 'غیرفعال', value: 'disable' },
];

const UpdateStatusForm: React.FC<UpdateStatusFormProps> = ({
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
        status: record.status,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateCompanyStatus(record.id, values.status);

      if (response.success) {
        form.resetFields();
        message.success('وضعیت تایید شرکت با موفقیت تغییر کرد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی وضعیت');
      }
    } catch (error) {
      console.error('Update status error:', error);
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
      title="تغییر وضعیت تایید شرکت"
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
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {record.logo && (
            <img
              src={record.logo}
              alt={record.name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.province.name} - {record.city.name}
            </div>
          </div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="status"
          label="وضعیت تایید"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={statusOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateStatusForm;
