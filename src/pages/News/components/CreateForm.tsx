import { createNews } from '@/services/news';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Form, message, Upload } from 'antd';
import moment from 'jalali-moment';
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

  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [portraitImageList, setPortraitImageList] = useState<UploadFile[]>([]);
  const [previewImageList, setPreviewImageList] = useState<UploadFile[]>([]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setPortraitImageList([]);
      setPreviewImageList([]);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    // Validate that all images are uploaded
    if (imageList.length === 0 || !imageList[0].originFileObj) {
      message.error('تصویر اصلی الزامی است');
      return;
    }
    if (portraitImageList.length === 0 || !portraitImageList[0].originFileObj) {
      message.error('تصویر عمودی الزامی است');
      return;
    }
    if (previewImageList.length === 0 || !previewImageList[0].originFileObj) {
      message.error('تصویر پیش‌نمایش الزامی است');
      return;
    }

    const hide = message.loading('در حال ایجاد...');

    try {
      // Convert all images to base64
      const imageBase64 = await fileToBase64(imageList[0].originFileObj);
      const portraitImageBase64 = await fileToBase64(
        portraitImageList[0].originFileObj,
      );
      const previewImageBase64 = await fileToBase64(
        previewImageList[0].originFileObj,
      );

      // Convert Jalali date to Gregorian for API
      const publishDate = values.publish_at
        ? moment
            .from(values.publish_at, 'fa', 'jYYYY/jMM/jDD')
            .format('YYYY-MM-DD HH:mm:ss')
        : moment().format('YYYY-MM-DD HH:mm:ss');

      const payload: API.NewsPayload = {
        title: values.title,
        content: values.content,
        summary: values.summary,
        image: imageBase64,
        portrait_image: portraitImageBase64,
        preview_image: previewImageBase64,
        alt_image: values.alt_image || '',
        publish_at: publishDate,
        author_id: null,
        status: values.status,
        study_time: values.study_time,
      };

      const res = await createNews(payload);
      hide();

      if (res.success) {
        message.success('خبر با موفقیت ایجاد شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در ایجاد خبر');
      }
    } catch (error) {
      hide();
      message.error('خطا در ایجاد خبر');
      console.error(error);
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
      title="افزودن خبر جدید"
      form={form}
      open={open}
      onOpenChange={handleOpenChange}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        width: 700,
      }}
    >
      <ProFormText
        name="title"
        label="عنوان"
        placeholder="عنوان خبر را وارد کنید"
        rules={[{ required: true, message: 'عنوان الزامی است' }]}
      />

      <ProFormTextArea
        name="summary"
        label="خلاصه"
        placeholder="خلاصه خبر را وارد کنید"
        rules={[{ required: true, message: 'خلاصه الزامی است' }]}
        fieldProps={{
          rows: 3,
        }}
      />

      <ProFormTextArea
        name="content"
        label="محتوا"
        placeholder="محتوای کامل خبر را وارد کنید"
        rules={[{ required: true, message: 'محتوا الزامی است' }]}
        fieldProps={{
          rows: 6,
        }}
      />

      <ProFormDatePicker
        name="publish_at"
        label="تاریخ انتشار"
        placeholder="تاریخ انتشار را انتخاب کنید"
        rules={[{ required: true, message: 'تاریخ انتشار الزامی است' }]}
        fieldProps={{
          format: 'jYYYY/jMM/jDD',
          style: { width: '100%' },
        }}
      />

      <ProFormDigit
        name="study_time"
        label="زمان مطالعه (دقیقه)"
        placeholder="زمان تقریبی مطالعه"
        min={1}
        rules={[{ required: true, message: 'زمان مطالعه الزامی است' }]}
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
        name="alt_image"
        label="متن جایگزین تصویر (Alt)"
        placeholder="توضیح تصویر برای SEO"
      />

      <Form.Item
        label="تصویر اصلی"
        required
        tooltip="تصویر اصلی خبر که در صفحه خبر نمایش داده می‌شود"
      >
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

      <Form.Item
        label="تصویر عمودی"
        required
        tooltip="تصویر عمودی برای نمایش در موبایل"
      >
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

      <Form.Item
        label="تصویر پیش‌نمایش"
        required
        tooltip="تصویر کوچک برای لیست اخبار"
      >
        <Upload
          listType="picture-card"
          fileList={previewImageList}
          onChange={({ fileList }) => setPreviewImageList(fileList)}
          beforeUpload={() => false}
          maxCount={1}
          accept="image/*"
        >
          {previewImageList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>
    </ModalForm>
  );
};

export default CreateForm;
