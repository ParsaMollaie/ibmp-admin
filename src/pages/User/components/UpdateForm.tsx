import { ModalForm, ProForm, ProFormText } from '@ant-design/pro-components';
import { Divider } from 'antd';
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
    width={600}
    open={props.updateModalVisible}
    modalProps={{
      destroyOnClose: true,
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
    submitter={{
      searchConfig: {
        submitText: 'ذخیره',
        resetText: 'انصراف',
      },
    }}
  >
    <ProFormText name="id" hidden />

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
        rules={[{ required: true, message: 'لطفاً نام خانوادگی را وارد کنید' }]}
        placeholder="نام خانوادگی"
      />
    </ProForm.Group>
    <ProFormText
      name="job_position"
      label="سمت شغلی"
      width="xl"
      placeholder="سمت شغلی را وارد کنید"
    />
  </ModalForm>
);

export default UpdateForm;
