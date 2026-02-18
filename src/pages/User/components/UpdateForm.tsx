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
        job_position: props.values.job_position,
      }}
      title="اطلاعات پایه"
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
        rules={[{ required: true, message: 'لطفاً نوع کاربر را انتخاب کنید' }]}
        options={[
          { value: 'admin', label: 'مدیر' },
          { value: 'client', label: 'کاربر عادی' },
        ]}
      />
    </StepsForm.StepForm>
  </StepsForm>
);

export default UpdateForm;
