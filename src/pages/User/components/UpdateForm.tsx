import {
  ProFormSelect,
  ProFormText,
  StepsForm,
} from '@ant-design/pro-components';
import { Modal } from 'antd';
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
  <StepsForm
    stepsProps={{
      size: 'small',
    }}
    stepsFormRender={(dom, submitter) => {
      return (
        <Modal
          width={800}
          bodyStyle={{ padding: '32px 40px 48px' }}
          destroyOnClose
          title="ویرایش کاربر"
          open={props.updateModalVisible}
          footer={submitter}
          onCancel={() => props.onCancel()}
        >
          {dom}
        </Modal>
      );
    }}
    onFinish={props.onSubmit}
  >
    <StepsForm.StepForm
      initialValues={{
        id: props.values.id,
        username: props.values.username,
        first_name: props.values.first_name,
        last_name: props.values.last_name,
        email: props.values.email,
      }}
      title="اطلاعات پایه"
    >
      <ProFormText name="id" hidden />
      <ProFormText name="username" label="نام کاربری" width="md" disabled />
      <ProFormText name="first_name" label="نام" width="md" />
      <ProFormText name="last_name" label="نام خانوادگی" width="md" />
      <ProFormText name="email" label="ایمیل" width="md" disabled />
    </StepsForm.StepForm>
    <StepsForm.StepForm
      initialValues={{
        user_type: props.values.user_type,
      }}
      title="تنظیمات"
    >
      <ProFormSelect
        name="user_type"
        label="نوع کاربر"
        width="md"
        disabled
        options={[
          { value: 'admin', label: 'مدیر' },
          { value: 'user', label: 'کاربر عادی' },
        ]}
      />
    </StepsForm.StepForm>
  </StepsForm>
);

export default UpdateForm;
