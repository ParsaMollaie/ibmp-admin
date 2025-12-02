import { updateNews } from '@/services/news';
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
import { Form, Image, message, Spin, Upload } from 'antd';
import moment from 'jalali-moment';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: API.NewsItem;
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

// Helper function to fetch image from URL and convert to base64
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

const UpdateForm: React.FC<UpdateFormProps> = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [portraitImageList, setPortraitImageList] = useState<UploadFile[]>([]);
  const [previewImageList, setPreviewImageList] = useState<UploadFile[]>([]);

  // Track if user has changed the images
  const [imageChanged, setImageChanged] = useState(false);
  const [portraitImageChanged, setPortraitImageChanged] = useState(false);
  const [previewImageChanged, setPreviewImageChanged] = useState(false);

  // Loading state for form submission (fetching images can take time)
  const [submitting, setSubmitting] = useState(false);

  // When record changes, populate the form
  useEffect(() => {
    if (record && open) {
      // Convert Gregorian date to Jalali for display
      const jalaliDate = record.publish_at
        ? moment(record.publish_at).locale('fa').format('jYYYY/jMM/jDD')
        : undefined;

      form.setFieldsValue({
        title: record.title,
        summary: record.summary,
        content: record.content,
        publish_at: jalaliDate,
        study_time: record.study_time,
        status: record.status,
        alt_image: record.alt_image,
      });

      // Reset image change flags
      setImageChanged(false);
      setPortraitImageChanged(false);
      setPreviewImageChanged(false);

      // Clear file lists
      setImageList([]);
      setPortraitImageList([]);
      setPreviewImageList([]);
    }
  }, [record, open, form]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setPortraitImageList([]);
      setPreviewImageList([]);
      setImageChanged(false);
      setPortraitImageChanged(false);
      setPreviewImageChanged(false);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    if (!record) return;

    setSubmitting(true);
    const hide = message.loading('در حال بروزرسانی...');

    try {
      // Prepare image data
      let imageBase64: string;
      let portraitImageBase64: string;
      let previewImageBase64: string;

      // For each image, either:
      // 1. Use the new uploaded file (if changed)
      // 2. Fetch the existing URL and convert to base64 (if not changed)

      if (imageChanged && imageList.length > 0 && imageList[0].originFileObj) {
        // User uploaded a new image
        imageBase64 = await fileToBase64(imageList[0].originFileObj);
      } else if (record.image) {
        // User didn't change image - fetch existing and convert to base64
        imageBase64 = await urlToBase64(record.image);
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر اصلی الزامی است');
        return;
      }

      if (
        portraitImageChanged &&
        portraitImageList.length > 0 &&
        portraitImageList[0].originFileObj
      ) {
        portraitImageBase64 = await fileToBase64(
          portraitImageList[0].originFileObj,
        );
      } else if (record.portrait_image) {
        portraitImageBase64 = await urlToBase64(record.portrait_image);
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر عمودی الزامی است');
        return;
      }

      if (
        previewImageChanged &&
        previewImageList.length > 0 &&
        previewImageList[0].originFileObj
      ) {
        previewImageBase64 = await fileToBase64(
          previewImageList[0].originFileObj,
        );
      } else if (record.preview_image) {
        previewImageBase64 = await urlToBase64(record.preview_image);
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر پیش‌نمایش الزامی است');
        return;
      }

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

      const res = await updateNews(record.id, payload);
      hide();
      setSubmitting(false);

      if (res.success) {
        message.success('خبر با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در بروزرسانی خبر');
      }
    } catch (error) {
      hide();
      setSubmitting(false);
      message.error('خطا در بروزرسانی خبر');
      console.error(error);
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>تغییر</div>
    </div>
  );

  return (
    <ModalForm
      title="ویرایش خبر"
      form={form}
      open={open}
      onOpenChange={handleOpenChange}
      onFinish={handleSubmit}
      submitter={{
        submitButtonProps: {
          loading: submitting,
        },
      }}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        width: 700,
      }}
    >
      <Spin spinning={submitting} tip="در حال پردازش تصاویر...">
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

        {/* Image Upload */}
        <Form.Item label="تصویر اصلی" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.image && !imageChanged && (
              <div>
                <Image
                  src={record.image}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              listType="picture-card"
              fileList={imageList}
              onChange={({ fileList }) => {
                setImageList(fileList);
                setImageChanged(true);
              }}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {imageList.length >= 1 ? null : uploadButton}
            </Upload>
          </div>
        </Form.Item>

        {/* Portrait Image Upload */}
        <Form.Item label="تصویر عمودی" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.portrait_image && !portraitImageChanged && (
              <div>
                <Image
                  src={record.portrait_image}
                  width={70}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              listType="picture-card"
              fileList={portraitImageList}
              onChange={({ fileList }) => {
                setPortraitImageList(fileList);
                setPortraitImageChanged(true);
              }}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {portraitImageList.length >= 1 ? null : uploadButton}
            </Upload>
          </div>
        </Form.Item>

        {/* Preview Image Upload */}
        <Form.Item label="تصویر پیش‌نمایش" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.preview_image && !previewImageChanged && (
              <div>
                <Image
                  src={record.preview_image}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              listType="picture-card"
              fileList={previewImageList}
              onChange={({ fileList }) => {
                setPreviewImageList(fileList);
                setPreviewImageChanged(true);
              }}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {previewImageList.length >= 1 ? null : uploadButton}
            </Upload>
          </div>
        </Form.Item>
      </Spin>
    </ModalForm>
  );
};

export default UpdateForm;
