import { updateServiceComment } from '@/services/serviceComment';
import { Form, Modal, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceCommentItem | null;
}

const UpdateForm: React.FC<UpdateFormProps> = ({
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
        is_active: record.is_active,
      });
    }
  }, [record, visible, form]);

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await updateServiceComment(record.id, {
        is_active: values.is_active,
      });

      if (response.success) {
        form.resetFields();
        message.success('نظر با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی نظر');
      }
    } catch (error) {
      console.error('Update comment error:', error);
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
      title="بروزرسانی نظر"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
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
          {record.commenter_type === 'user' ? (
            <div style={{ fontWeight: 600 }}>
              {record.first_name} {record.last_name}
            </div>
          ) : (
            <div style={{ fontWeight: 600, color: '#52c41a' }}>
              پاسخ صاحب خدمت
            </div>
          )}
          {record.mobile && (
            <div style={{ fontSize: 12, color: '#666' }}>
              موبایل: {record.mobile}
            </div>
          )}
          {record.service && (
            <div style={{ fontSize: 12, color: '#666' }}>
              خدمت: {record.service.title} (کد: {record.service.code})
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#333',
              whiteSpace: 'pre-wrap',
            }}
          >
            {record.description}
          </div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="is_active"
          label="وضعیت نمایش"
          valuePropName="checked"
          rules={[{ required: true, message: 'لطفاً وضعیت را مشخص کنید' }]}
        >
          <Switch checkedChildren="فعال" unCheckedChildren="غیرفعال" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
