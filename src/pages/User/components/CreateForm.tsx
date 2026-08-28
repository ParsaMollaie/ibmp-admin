import { addUser } from '@/services/auth';
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Divider, Form, Input, message } from 'antd';
import React from 'react';

export interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    try {
      await addUser({
        username: values.username,
        password: values.password,
        user_type: values.user_type,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        job_position: values.job_position,
      });

      message.success('کاربر با موفقیت ایجاد شد');
      form.resetFields();
      onSuccess();
      return true;
    } catch (error) {
      message.error('ایجاد کاربر انجام نشد، لطفا مجددا تلاش کنید');
      return false;
    }
  };

  return (
    <ModalForm
      title="افزودن کاربر"
      width={600}
      form={form}
      open={visible}
      modalProps={{
        destroyOnClose: true,
        onCancel,
      }}
      onFinish={handleFinish}
      submitter={{
        searchConfig: {
          submitText: 'ایجاد',
          resetText: 'انصراف',
        },
      }}
    >
      <Divider orientation="right" plain>
        اطلاعات حساب
      </Divider>
      <ProFormText
        name="username"
        label="نام کاربری"
        width="xl"
        rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }]}
        placeholder="نام کاربری را وارد کنید"
      />
      <ProFormSelect
        name="user_type"
        label="نوع کاربر"
        width="xl"
        rules={[{ required: true, message: 'لطفاً نوع کاربر را انتخاب کنید' }]}
        options={[
          { label: 'ادمین', value: 'admin' },
          { label: 'کاربر', value: 'client' },
        ]}
        placeholder="نوع کاربر را انتخاب کنید"
      />
      <ProFormText
        name="email"
        label="ایمیل"
        width="xl"
        rules={[{ type: 'email', message: 'فرمت ایمیل صحیح نیست' }]}
        placeholder="ایمیل را وارد کنید"
      />

      <Divider orientation="right" plain>
        اطلاعات شخصی
      </Divider>
      <ProForm.Group>
        <ProFormText
          name="first_name"
          label="نام"
          width="sm"
          rules={[{ required: true, message: 'لطفاً نام را وارد کنید' }]}
          placeholder="نام"
        />
        <ProFormText
          name="last_name"
          label="نام خانوادگی"
          width="sm"
          rules={[
            { required: true, message: 'لطفاً نام خانوادگی را وارد کنید' },
          ]}
          placeholder="نام خانوادگی"
        />
      </ProForm.Group>
      <ProFormText
        name="job_position"
        label="سمت شغلی"
        width="xl"
        dependencies={['user_type']}
        rules={[
          ({ getFieldValue }) => ({
            required: getFieldValue('user_type') === 'client',
            message: 'برای کاربر از نوع "کاربر"، وارد کردن سمت شغلی الزامی است',
          }),
        ]}
        placeholder="سمت شغلی را وارد کنید"
      />

      <Divider orientation="right" plain>
        رمز عبور
      </Divider>
      <Form.Item
        name="password"
        label="رمز عبور"
        rules={[
          { required: true, message: 'لطفا رمز عبور را وارد کنید' },
          { min: 8, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
        ]}
      >
        <Input.Password placeholder="رمز عبور را وارد کنید" />
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
        <Input.Password placeholder="تکرار رمز عبور را وارد کنید" />
      </Form.Item>
    </ModalForm>
  );
};

export default CreateForm;
