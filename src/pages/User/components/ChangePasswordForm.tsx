import { changeUserPassword } from '@/services/auth';
import { Form, Input, message, Modal } from 'antd';
import React from 'react';

interface ChangePasswordFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  userId: string | null;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  userId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!userId) return;

      setLoading(true);
      await changeUserPassword(userId, {
        password: values.password,
        repeat_password: values.repeat_password,
      });

      message.success('رمز عبور با موفقیت تغییر کرد');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error?.errorFields) return; // validation error
      message.error('خطا در تغییر رمز عبور');
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
      title="تغییر رمز عبور"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ثبت"
      cancelText="انصراف"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="password"
          label="رمز عبور جدید"
          rules={[
            { required: true, message: 'لطفا رمز عبور جدید را وارد کنید' },
            { min: 8, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="repeat_password"
          label="تکرار رمز عبور"
          dependencies={['password']}
          rules={[
            { required: true, message: 'لطفا تکرار رمز عبور را وارد کنید' },
            { min: 8, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('رمز عبور و تکرار آن مطابقت ندارند'),
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordForm;
