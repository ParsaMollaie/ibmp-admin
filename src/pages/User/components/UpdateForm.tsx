import { ModalForm, ProFormText } from '@ant-design/pro-components';
import React from 'react';

export interface FormValueType extends Partial<API.UserInfo> {
  id?: string;
  first_name?: string;
  last_name?: string;
}

export interface UpdateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalVisible: boolean;
  values: Partial<API.UserInfo>;
}

const UpdateForm: React.FC<UpdateFormProps> = (props) => (
  <ModalForm
    title="ویرایش کاربر"
    width={800}
    open={props.updateModalVisible}
    modalProps={{
      destroyOnClose: true,
      bodyStyle: { padding: '32px 40px 48px' },
      onCancel: () => props.onCancel(),
    }}
    initialValues={{
      id: props.values.id,
      username: props.values.username,
      first_name: props.values.first_name,
      last_name: props.values.last_name,
      email: props.values.email,
      job_position: props.values.job_position,
    }}
    onFinish={props.onSubmit}
  >
    <ProFormText name="id" hidden />
    <ProFormText
      name="username"
      label="نام کاربری"
      width="md"
      rules={[{ required: true, message: 'لطفاً نام کاربری را وارد کنید' }]}
    />
    <ProFormText
      name="first_name"
      label="نام"
      width="md"
      rules={[{ required: true, message: 'لطفاً نام را وارد کنید' }]}
    />
    <ProFormText
      name="last_name"
      label="نام خانوادگی"
      width="md"
      rules={[{ required: true, message: 'لطفاً نام خانوادگی را وارد کنید' }]}
    />
    <ProFormText
      name="email"
      label="ایمیل"
      width="md"
      rules={[{ type: 'email', message: 'فرمت ایمیل صحیح نیست' }]}
    />
    <ProFormText name="job_position" label="سمت شغلی" width="md" />
  </ModalForm>
);

export default UpdateForm;
