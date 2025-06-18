import {
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { Modal } from 'antd';
import React from 'react';

export interface FormValueType extends Partial<API.CompanyInfo> {
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalVisible: boolean;
  values: Partial<API.CompanyInfo>;
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
          title="ویرایش شرکت"
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
        title: props.values.title,
        code: props.values.code,
        description: props.values.description,
      }}
      title="اطلاعات پایه"
    >
      <ProFormText name="code" label="کد شرکت" width="md" disabled />
      <ProFormText
        name="title"
        label="عنوان شرکت"
        width="md"
        rules={[{ required: true, message: 'لطفا عنوان شرکت را وارد کنید' }]}
      />
      <ProFormTextArea
        name="description"
        label="توضیحات"
        width="md"
        placeholder="توضیحات مربوط به شرکت"
      />
    </StepsForm.StepForm>
    <StepsForm.StepForm
      initialValues={{
        type: props.values.type,
        status: props.values.status,
        color: props.values.color,
      }}
      title="تنظیمات"
    >
      <ProFormSelect
        name="type"
        label="نوع شرکت"
        width="md"
        valueEnum={{
          'نوع ۱': 'نوع ۱',
          'نوع ۲': 'نوع ۲',
          'نوع ۳': 'نوع ۳',
        }}
      />
      <ProFormSelect
        name="status"
        label="وضعیت"
        width="md"
        valueEnum={{
          فعال: 'فعال',
          غیرفعال: 'غیرفعال',
          'در حال بررسی': 'در حال بررسی',
        }}
      />
      <ProFormSelect
        name="color"
        label="رنگ"
        width="md"
        valueEnum={{
          قرمز: 'قرمز',
          آبی: 'آبی',
          سبز: 'سبز',
          زرد: 'زرد',
        }}
      />
    </StepsForm.StepForm>
    <StepsForm.StepForm
      initialValues={{
        startDate: props.values.startDate,
        endDate: props.values.endDate,
      }}
      title="تاریخ ها"
    >
      <ProFormDatePicker name="startDate" label="تاریخ شروع" width="md" />
      <ProFormDatePicker name="endDate" label="تاریخ پایان" width="md" />
    </StepsForm.StepForm>
  </StepsForm>
);

export default UpdateForm;
