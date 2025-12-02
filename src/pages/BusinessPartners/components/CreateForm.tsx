import { createBusinessPartner } from '@/services/business-partners';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Form, message, Upload } from 'antd';
import React, { useState } from 'react';

interface CreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const CreateForm: React.FC<CreateFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // State for image upload
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  // Reset form and file list when modal closes
  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    const hide = message.loading('در حال ایجاد...');

    try {
      // Convert uploaded file to base64
      let imageBase64: string | null = null;

      if (imageList.length > 0 && imageList[0].originFileObj) {
        imageBase64 = await fileToBase64(imageList[0].originFileObj);
      }

      const payload: API.BusinessPartnerPayload = {
        title: values.title,
        priority: values.priority,
        status: values.status,
        link: values.link,
        alt_image: values.alt_image || null,
        image: imageBase64,
      };

      const res = await createBusinessPartner(payload);
      hide();

      if (res.success) {
        message.success('شریک تجاری با موفقیت ایجاد شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در ایجاد شریک تجاری');
      }
    } catch (error) {
      hide();
      message.error('خطا در ایجاد شریک تجاری');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>آپلود</div>
    </div>
  );

  return (
    <ModalForm
      title="افزودن شریک تجاری جدید"
      form={form}
      open={open}
      onOpenChange={handleOpenChange}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
    >
      <ProFormText
        name="title"
        label="عنوان"
        placeholder="عنوان شریک تجاری را وارد کنید"
        rules={[{ required: true, message: 'عنوان الزامی است' }]}
      />

      <ProFormDigit
        name="priority"
        label="اولویت"
        placeholder="اولویت نمایش"
        min={1}
        rules={[{ required: true, message: 'اولویت الزامی است' }]}
      />

      <ProFormSelect
        name="status"
        label="وضعیت"
        placeholder="وضعیت را انتخاب کنید"
        rules={[{ required: true, message: 'انتخاب وضعیت الزامی است' }]}
        options={[
          { label: 'فعال', value: 'active' },
          { label: 'غیرفعال', value: 'inactive' },
        ]}
      />

      <ProFormText
        name="link"
        label="لینک"
        placeholder="https://example.com"
        rules={[
          { required: true, message: 'لینک الزامی است' },
          { type: 'url', message: 'لطفاً یک URL معتبر وارد کنید' },
        ]}
      />

      <ProFormText
        name="alt_image"
        label="متن جایگزین تصویر (Alt)"
        placeholder="توضیح تصویر برای SEO"
      />

      <Form.Item label="تصویر" name="image">
        <Upload
          listType="picture-card"
          fileList={imageList}
          onChange={({ fileList }) => setImageList(fileList)}
          beforeUpload={() => false}
          maxCount={1}
          accept="image/*"
        >
          {imageList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>
    </ModalForm>
  );
};

export default CreateForm;
