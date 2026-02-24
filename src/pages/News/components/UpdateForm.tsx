import RichTextEditor from '@/components/RichTextEditor';
import { updateNews } from '@/services/news';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Form, Image, message, Spin, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker from 'react-multi-date-picker';

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

  // Loading state for form submission
  const [submitting, setSubmitting] = useState(false);

  // When record changes, populate the form
  useEffect(() => {
    if (record && open) {
      // Pass dayjs object — JalaliLocaleListener ensures it renders as Jalali

      const jalaliDate = convertEnDateToFaDate(record.publish_at);

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
      // Convert Jalali date to Gregorian for API
      const publishDate = convertFaDateToEnDate(values.publish_at).format(
        'YYYY-MM-DD HH:mm:ss',
      );

      // Start with required fields
      const payload: Partial<API.NewsPayload> = {
        title: values.title,
        content: values.content,
        summary: values.summary,
        alt_image: values.alt_image || '',
        publish_at: publishDate,
        author_id: null,
        status: values.status,
        study_time: values.study_time,
      };

      // Handle main image
      if (imageChanged) {
        if (imageList.length > 0 && imageList[0].originFileObj) {
          // User uploaded a new image
          payload.image = await fileToBase64(imageList[0].originFileObj);
        } else {
          // User removed the image
          payload.image = '';
        }
      } else if (record.image) {
        // No changes - keep existing image
        payload.image = record.image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر اصلی الزامی است');
        return;
      }

      // Handle portrait image
      if (portraitImageChanged) {
        if (
          portraitImageList.length > 0 &&
          portraitImageList[0].originFileObj
        ) {
          payload.portrait_image = await fileToBase64(
            portraitImageList[0].originFileObj,
          );
        } else {
          payload.portrait_image = '';
        }
      } else if (record.portrait_image) {
        payload.portrait_image = record.portrait_image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر عمودی الزامی است');
        return;
      }

      // Handle preview image
      if (previewImageChanged) {
        if (previewImageList.length > 0 && previewImageList[0].originFileObj) {
          payload.preview_image = await fileToBase64(
            previewImageList[0].originFileObj,
          );
        } else {
          payload.preview_image = '';
        }
      } else if (record.preview_image) {
        payload.preview_image = record.preview_image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر پیش‌نمایش الزامی است');
        return;
      }

      const res = await updateNews(record.id, payload as API.NewsPayload);
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
      <Spin spinning={submitting} tip="در حال پردازش...">
        <ProFormText
          name="title"
          label="عنوان"
          placeholder="عنوان خبر را وارد کنید"
          rules={[{ required: true, message: 'عنوان الزامی است' }]}
        />

        <Form.Item
          name="summary"
          label="خلاصه"
          rules={[{ required: true, message: 'خلاصه الزامی است' }]}
        >
          <RichTextEditor placeholder="خلاصه خبر را وارد کنید" />
        </Form.Item>

        <Form.Item
          name="content"
          label="محتوا"
          rules={[{ required: true, message: 'محتوا الزامی است' }]}
        >
          <RichTextEditor placeholder="محتوای کامل خبر را وارد کنید" />
        </Form.Item>

        <Form.Item
          name="publish_at"
          label="تاریخ انتشار"
          rules={[{ required: true, message: 'تاریخ انتشار الزامی است' }]}
        >
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            format="YYYY/MM/DD"
            placeholder="تاریخ انتشار را انتخاب کنید"
            style={{ width: '100%' }}
          />
        </Form.Item>

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
              onRemove={() => {
                setImageChanged(true);
                return true;
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
              onRemove={() => {
                setPortraitImageChanged(true);
                return true;
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
              onRemove={() => {
                setPreviewImageChanged(true);
                return true;
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
