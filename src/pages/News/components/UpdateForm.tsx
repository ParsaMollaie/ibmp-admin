import { updateNews } from '@/services/auth';
import { PlusOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form, Modal, Upload, message } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useState } from 'react';

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: API.NewsItem;
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>(
    initialValues.image || '',
  );
  const [portraitImagePreview, setPortraitImagePreview] = useState<string>(
    initialValues.portrait_image || '',
  );
  const [previewImagePreview, setPreviewImagePreview] = useState<string>(
    initialValues.preview_image || '',
  );

  const handleImageChange: UploadProps['onChange'] = async ({ file }) => {
    if (file.status === 'removed') {
      setImagePreview(initialValues.image || '');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setImagePreview(file.url || (file.preview as string));
  };

  const handlePortraitImageChange: UploadProps['onChange'] = async ({
    file,
  }) => {
    if (file.status === 'removed') {
      setPortraitImagePreview(initialValues.portrait_image || '');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPortraitImagePreview(file.url || (file.preview as string));
  };

  const handlePreviewImageChange: UploadProps['onChange'] = async ({
    file,
  }) => {
    if (file.status === 'removed') {
      setPreviewImagePreview(initialValues.preview_image || '');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImagePreview(file.url || (file.preview as string));
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('فقط فایل‌های تصویری قابل آپلود هستند!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('حجم تصویر باید کمتر از 5MB باشد!');
    }
    return isImage && isLt5M;
  };

  const handleSubmit = async (values: any) => {
    try {
      delete values.image;
      delete values.portrait_image;
      delete values.preview_image;

      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      if (imagePreview && imagePreview !== initialValues.image) {
        formData.append('image', imagePreview);
      }

      if (
        portraitImagePreview &&
        portraitImagePreview !== initialValues.portrait_image
      ) {
        formData.append('portrait_image', portraitImagePreview);
      }

      if (
        previewImagePreview &&
        previewImagePreview !== initialValues.preview_image
      ) {
        formData.append('preview_image', previewImagePreview);
      }

      await updateNews(initialValues.id, formData);
      message.success('خبر با موفقیت به‌روزرسانی شد');
      onSuccess();
    } catch (error) {
      message.error('خطا در به‌روزرسانی خبر');
    }
  };

  return (
    <Modal
      width={800}
      title="ویرایش خبر"
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="ذخیره"
      cancelText="انصراف"
    >
      <ProForm
        form={form}
        onFinish={handleSubmit}
        submitter={false}
        layout="vertical"
        initialValues={initialValues}
        validateMessages={{
          required: 'این فیلد اجباری است',
        }}
      >
        <ProFormText
          name="title"
          label="عنوان خبر"
          placeholder="عنوان خبر را وارد کنید"
          rules={[{ required: true }]}
        />

        <ProFormTextArea
          name="summary"
          label="خلاصه خبر"
          placeholder="خلاصه خبر را وارد کنید"
          rules={[{ required: true }]}
          fieldProps={{
            showCount: true,
            maxLength: 500,
            autoSize: { minRows: 3, maxRows: 5 },
          }}
        />

        <ProFormTextArea
          name="content"
          label="محتوا"
          placeholder="محتوا خبر را وارد کنید"
          rules={[{ required: true }]}
          fieldProps={{
            showCount: true,
            autoSize: { minRows: 5, maxRows: 10 },
          }}
        />

        <ProFormDigit
          name="study_time"
          label="زمان مطالعه (دقیقه)"
          placeholder="زمان مطالعه را وارد کنید"
          min={1}
          max={60}
          rules={[{ required: true }]}
        />

        <ProFormText
          name="alt_image"
          label="متن جایگزین تصویر"
          placeholder="متن جایگزین برای تصویر"
          rules={[{ required: true }]}
        />

        <Form.Item
          name="image"
          label="تصویر اصلی"
          rules={[{ required: true, message: 'لطفاً تصویر را آپلود کنید' }]}
        >
          <Upload
            name="image"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleImageChange}
            maxCount={1}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="portrait_image"
          label="تصویر عمودی"
          rules={[{ required: true, message: 'لطفاً تصویر را آپلود کنید' }]}
        >
          <Upload
            name="portrait_image"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handlePortraitImageChange}
            maxCount={1}
          >
            {portraitImagePreview ? (
              <img
                src={portraitImagePreview}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          name="preview_image"
          label="تصویر پیش‌نمایش"
          rules={[{ required: true, message: 'لطفاً تصویر را آپلود کنید' }]}
        >
          <Upload
            name="preview_image"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handlePreviewImageChange}
            maxCount={1}
          >
            {previewImagePreview ? (
              <img
                src={previewImagePreview}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <ProFormSelect
          name="status"
          label="وضعیت"
          placeholder="وضعیت را انتخاب کنید"
          rules={[{ required: true }]}
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <ProFormDatePicker
          name="publish_at"
          label="تاریخ انتشار"
          rules={[{ required: true }]}
          fieldProps={{
            format: 'YYYY-MM-DD HH:mm:ss',
            showTime: { format: 'HH:mm:ss' },
          }}
        />
      </ProForm>
    </Modal>
  );
};

export default UpdateForm;
