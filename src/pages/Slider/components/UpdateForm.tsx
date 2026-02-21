import { updateSlider } from '@/services/auth';
import { PlusOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, Modal, Upload, message } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: API.SliderItem;
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

  const [imageFile, setImageFile] = useState<RcFile | null>(null);
  const [portraitImageFile, setPortraitImageFile] = useState<RcFile | null>(
    null,
  );

  const [imageChanged, setImageChanged] = useState(false);
  const [portraitImageChanged, setPortraitImageChanged] = useState(false);

  // Reset states when modal opens with new initialValues
  useEffect(() => {
    if (visible) {
      setImagePreview(initialValues.image || '');
      setPortraitImagePreview(initialValues.portrait_image || '');
      setImageFile(null);
      setPortraitImageFile(null);
      setImageChanged(false);
      setPortraitImageChanged(false);
    }
  }, [visible, initialValues]);

  const handleImageChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'removed') {
      setImageFile(null);
      setImagePreview('');
      setImageChanged(true);
      return;
    }

    if (file.originFileObj) {
      // For immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file.originFileObj as RcFile);

      setImageFile(file.originFileObj as RcFile);
      setImageChanged(true);
    }
  };

  const handlePortraitImageChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'removed') {
      setPortraitImageFile(null);
      setPortraitImagePreview('');
      setPortraitImageChanged(true);
      return;
    }

    if (file.originFileObj) {
      // For immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPortraitImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file.originFileObj as RcFile);

      setPortraitImageFile(file.originFileObj as RcFile);
      setPortraitImageChanged(true);
    }
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
    return false; // Prevent auto upload
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();

      // Add all form values
      Object.keys(values).forEach((key) => {
        if (
          values[key] !== undefined &&
          key !== 'image' &&
          key !== 'portrait_image'
        ) {
          formData.append(key, values[key]);
        }
      });

      // Handle main image - only if changed
      if (imageChanged) {
        if (imageFile) {
          // New image uploaded
          formData.append('image', imageFile);
        } else {
          // Image was removed - send empty string to indicate removal
          formData.append('image', '');
        }
      }
      // If not changed, don't append image field at all

      // Handle portrait image - only if changed
      if (portraitImageChanged) {
        if (portraitImageFile) {
          // New portrait image uploaded
          formData.append('portrait_image', portraitImageFile);
        } else {
          // Portrait image was removed - send empty string
          formData.append('portrait_image', '');
        }
      }
      // If not changed, don't append portrait_image field at all

      await updateSlider(initialValues.id, formData);

      message.success('اسلایدر با موفقیت به‌روزرسانی شد');
      onSuccess();
    } catch (error) {
      console.error('Update slider error:', error);
      message.error('خطا در به‌روزرسانی اسلایدر');
    }
  };

  return (
    <Modal
      width={800}
      title="ویرایش اسلایدر"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <ProForm
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          title: initialValues.title,
          type: initialValues.type,
          status: initialValues.status,
          priority: initialValues.priority,
          link: initialValues.link,
          alt_image: initialValues.alt_image,
        }}
        submitter={{
          searchConfig: {
            submitText: 'ذخیره تغییرات',
            resetText: 'انصراف',
          },
        }}
      >
        <ProFormText
          name="title"
          label="عنوان"
          placeholder="عنوان اسلایدر را وارد کنید"
          rules={[{ required: true, message: 'لطفاً عنوان را وارد کنید' }]}
        />

        <ProFormSelect
          name="type"
          label="نوع اسلایدر"
          placeholder="نوع اسلایدر را انتخاب کنید"
          rules={[
            { required: true, message: 'لطفاً نوع اسلایدر را انتخاب کنید' },
          ]}
          options={[
            { value: 'main', label: 'اصلی' },
            { value: 'secondary', label: 'ثانویه' },
          ]}
        />

        <ProFormSelect
          name="status"
          label="وضعیت"
          placeholder="وضعیت اسلایدر را انتخاب کنید"
          rules={[
            { required: true, message: 'لطفاً وضعیت اسلایدر را انتخاب کنید' },
          ]}
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <ProFormDigit
          name="priority"
          label="اولویت"
          placeholder="اولویت نمایش را وارد کنید"
          min={1}
          max={100}
          rules={[{ required: true, message: 'لطفاً اولویت را وارد کنید' }]}
        />

        <ProFormText
          name="link"
          label="لینک"
          placeholder="https://example.com"
          rules={[{ type: 'url', message: 'لطفاً یک URL معتبر وارد کنید' }]}
        />

        <ProFormText
          name="alt_image"
          label="متن جایگزین تصویر"
          placeholder="متن جایگزین برای تصویر"
          rules={[
            { required: true, message: 'لطفاً متن جایگزین تصویر را وارد کنید' },
          ]}
        />

        <Form.Item
          label="تصویر اصلی"
          required
          tooltip="تصویر اصلی اسلایدر - اگر نمی‌خواهید تغییر کند، خالی بگذارید"
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Show existing image if available and not changed */}
            {initialValues.image && !imageChanged && (
              <div>
                <img
                  src={initialValues.image}
                  alt="current"
                  style={{
                    width: 100,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                  }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              name="image"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handleImageChange}
              maxCount={1}
              accept="image/*"
            >
              {imageChanged && imagePreview ? (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>تغییر</div>
                </div>
              )}
            </Upload>
          </div>
        </Form.Item>

        <Form.Item label="تصویر پرتره">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Show existing portrait image if available and not changed */}
            {initialValues.portrait_image && !portraitImageChanged && (
              <div>
                <img
                  src={initialValues.portrait_image}
                  alt="current portrait"
                  style={{
                    width: 80,
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                  }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              name="portrait_image"
              listType="picture-card"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handlePortraitImageChange}
              maxCount={1}
              accept="image/*"
            >
              {portraitImageChanged && portraitImagePreview ? (
                <img
                  src={portraitImagePreview}
                  alt="portrait preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>تغییر</div>
                </div>
              )}
            </Upload>
          </div>
        </Form.Item>
      </ProForm>
    </Modal>
  );
};

export default UpdateForm;
