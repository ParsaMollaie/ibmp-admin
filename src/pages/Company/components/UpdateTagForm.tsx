import { updateCompanyTag } from '@/services/company';
import { Form, Modal, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';

// Props interface for the tag update modal
interface UpdateTagFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CompanyItem | null;
}

// Tag options with Persian labels and colors for display
const tagOptions: { label: string; value: API.CompanyTag; color: string }[] = [
  { label: 'عادی', value: 'regular', color: '#666' },
  { label: 'پربازدید', value: 'most-view', color: '#1890ff' },
  { label: 'ویژه', value: 'promoted', color: '#52c41a' },
];

const UpdateTagForm: React.FC<UpdateTagFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Populate form when record changes or modal opens
  useEffect(() => {
    if (record && visible) {
      form.setFieldsValue({
        tag: record.tag,
      });
    }
  }, [record, visible, form]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Call the API with the new tag value
      const response = await updateCompanyTag(record.id, values.tag);

      if (response.success) {
        form.resetFields();
        message.success('وضعیت شرکت با موفقیت تغییر کرد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی وضعیت');
      }
    } catch (error) {
      console.error('Update tag error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="تغییر وضعیت شرکت"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={450}
    >
      {/* Display company info for reference */}
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
          {/* Company logo */}
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
          name="tag"
          label="وضعیت نمایش"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select
            options={tagOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateTagForm;
