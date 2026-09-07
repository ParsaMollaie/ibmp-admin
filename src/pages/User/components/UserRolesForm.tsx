import { getUserRoles, updateUserRoles } from '@/services/auth';
import { getRoles } from '@/services/role';
import { Form, message, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';

interface UserRolesFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  userId: string | null;
}

const UserRolesForm: React.FC<UserRolesFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  userId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (!visible || !userId) {
      return;
    }

    const loadData = async () => {
      setFetching(true);
      try {
        const [rolesResponse, userRolesResponse] = await Promise.all([
          getRoles({ page_size: 1000 }),
          getUserRoles(userId),
        ]);

        setRoleOptions(
          (rolesResponse?.data?.list || []).map((role) => ({
            label: role.title || role.name,
            value: role.name,
          })),
        );
        form.setFieldsValue({ roles: userRolesResponse?.data || [] });
      } catch (error) {
        message.error('خطا در دریافت نقش‌های کاربر');
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [visible, userId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!userId) return;

      setLoading(true);
      const response = await updateUserRoles(userId, values.roles || []);

      if (response.success) {
        message.success('نقش‌های کاربر با موفقیت به‌روزرسانی شد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در به‌روزرسانی نقش‌های کاربر');
      }
    } catch (error: any) {
      if (error?.errorFields) return; // validation error
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
      title="نقش‌های کاربر"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="roles" label="نقش‌ها">
          <Select
            mode="multiple"
            placeholder="انتخاب نقش‌ها"
            options={roleOptions}
            loading={fetching}
            allowClear
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserRolesForm;
