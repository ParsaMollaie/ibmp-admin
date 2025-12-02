import { createAdvertising } from '@/services/advertising';
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

  // State for image uploads (we store the file list for display, but send base64 to API)
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [portraitImageList, setPortraitImageList] = useState<UploadFile[]>([]);

  // Reset form and file lists when modal closes
  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setPortraitImageList([]);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    try {
      // Convert uploaded files to base64
      let imageBase64: string | null = null;
      let portraitImageBase64: string | null = null;

      if (imageList.length > 0 && imageList[0].originFileObj) {
        imageBase64 = await fileToBase64(imageList[0].originFileObj);
      }

      if (portraitImageList.length > 0 && portraitImageList[0].originFileObj) {
        portraitImageBase64 = await fileToBase64(
          portraitImageList[0].originFileObj,
        );
      }

      const payload: API.AdvertisingPayload = {
        title: values.title,
        priority: values.priority,
        status: values.status,
        section: values.section,
        link: values.link,
        alt_image: values.alt_image || null,
        image: imageBase64,
        portrait_image: portraitImageBase64,
      };

      const res = await createAdvertising(payload);

      if (res.success) {
        message.success('تبلیغ با موفقیت ایجاد شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در ایجاد تبلیغ');
      }
    } catch (error) {
      message.error('خطا در ایجاد تبلیغ');
    }
  };

  // Custom upload component that prevents actual upload (we handle it manually)
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>آپلود</div>
    </div>
  );

  return (
    <ModalForm
      title="افزودن تبلیغ جدید"
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
        placeholder="عنوان تبلیغ را وارد کنید"
        rules={[{ required: true, message: 'عنوان الزامی است' }]}
      />

      <ProFormSelect
        name="section"
        label="بخش"
        placeholder="بخش نمایش را انتخاب کنید"
        rules={[{ required: true, message: 'انتخاب بخش الزامی است' }]}
        options={[
          { label: 'بخش اول صفحه اصلی', value: 'main_page_first_section' },
          { label: 'بخش دوم صفحه اصلی', value: 'main_page_second_section' },
          { label: 'بخش سوم صفحه اصلی', value: 'main_page_third_section' },
        ]}
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

      {/* Image Upload */}
      <Form.Item label="تصویر اصلی" name="image">
        <Upload
          listType="picture-card"
          fileList={imageList}
          onChange={({ fileList }) => setImageList(fileList)}
          beforeUpload={() => false} // Prevent auto upload
          maxCount={1}
          accept="image/*"
        >
          {imageList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>

      {/* Portrait Image Upload */}
      <Form.Item label="تصویر عمودی" name="portrait_image">
        <Upload
          listType="picture-card"
          fileList={portraitImageList}
          onChange={({ fileList }) => setPortraitImageList(fileList)}
          beforeUpload={() => false}
          maxCount={1}
          accept="image/*"
        >
          {portraitImageList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>
    </ModalForm>
  );
};

export default CreateForm;
